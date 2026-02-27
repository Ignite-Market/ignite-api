import { HttpStatus, Injectable } from '@nestjs/common';
import axios from 'axios';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import { AppEnvironment } from '../../config/types';
import { env } from '../../config/env';
import { CodeException } from '../../lib/exceptions/exceptions';
import { predictionTemplates, PredictionTemplate } from '../../config/prediction-templates';
import { GenerateFromTemplateDto } from './dtos/generate-from-template.dto';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class PredictionTemplateService {
  /**
   * Get all available templates.
   */
  public getTemplates() {
    return predictionTemplates.map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      imgUrl: template.imgUrl,
      variables: template.variables
    }));
  }

  /**
   * Get template by ID.
   */
  public getTemplateById(id: string): any {
    return predictionTemplates.find((t) => t.id === id) || null;
  }

  /**
   * Generate prediction data from template.
   */
  public generateFromTemplate(templateId: string, variables: GenerateFromTemplateDto, context: any) {
    const template = this.getTemplateById(templateId);

    if (!template) {
      throw new CodeException({
        code: 'TEMPLATE_NOT_FOUND',
        status: HttpStatus.NOT_FOUND,
        sourceFunction: `${this.constructor.name}/generateFromTemplate`,
        errorMessage: `Template with id ${templateId} not found`,
        context
      });
    }

    // Parse attestation time
    const attestationTime = variables.attestationTime ? dayjs(variables.attestationTime).utc() : null;

    if (!attestationTime || !attestationTime.isValid()) {
      throw new CodeException({
        code: 'INVALID_ATTESTATION_TIME',
        status: HttpStatus.BAD_REQUEST,
        sourceFunction: `${this.constructor.name}/generateFromTemplate`,
        errorMessage: 'Invalid attestation time',
        context
      });
    }

    // Get API proxy prefix based on environment
    const apiProxyPrefix = this.getApiProxyPrefix();

    // Prepare replacement values
    const replacements: Record<string, any> = {
      price: variables.price,
      priceFormatted: variables.price?.toLocaleString(),
      goal: variables.goal,
      goalFormatted: variables.goal?.toLocaleString(),
      comparisonType: variables.comparisonType || 'above',
      attestationTime: attestationTime.utc().format('MMM D, YYYY HH:mm'),
      attestationTimeUnix: attestationTime.unix(),
      attestationTimeUnixMs: attestationTime.unix() * 1000,
      attestationTimeDate: attestationTime.utc().format('YYYY-MM-DD'),
      attestationTimeFormatted: attestationTime.tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss'),
      comparisonOp: variables.comparisonType === 'below' ? '<' : '>=',
      apiProxyPrefix: apiProxyPrefix,
      homeTeamName: variables.homeTeamName,
      awayTeamName: variables.awayTeamName,
      sofascoreMatchId: variables.sofascoreMatchId,
      pandascoreMatchId: variables.pandascoreMatchId,
      livescoreEid: variables.livescoreEid,
      livescoreCategory: variables.livescoreCategory || 'basketball',
      matchDateFormatted: attestationTime.utc().format('MMMM D, YYYY HH:mm:ss')
    };

    // Replace placeholders in question
    let question = this.replacePlaceholders(template.questionTemplate, replacements);

    // Replace placeholders in outcome resolution
    let outcomeResolutionDef = this.replacePlaceholders(template.outcomeResolutionTemplate, replacements);

    // Generate data sources
    const dataSources = template.dataSourceTemplates.map((dsTemplate: any) => {
      const endpoint = this.replacePlaceholders(dsTemplate.endpoint, replacements);

      // Replace placeholders in query params
      const queryParams: Record<string, string> = {};
      if (dsTemplate.queryParams) {
        for (const [key, value] of Object.entries(dsTemplate.queryParams)) {
          queryParams[key] = this.replacePlaceholders(String(value), replacements);
        }
      }

      // Replace placeholders in jq query
      const jqQuery = this.replacePlaceholders(dsTemplate.jqQuery, replacements);

      return {
        endpoint,
        httpMethod: dsTemplate.httpMethod,
        queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined,
        headers: dsTemplate.headers,
        body: dsTemplate.body,
        jqQuery,
        abi: JSON.stringify(dsTemplate.abi)
      };
    });

    return {
      question,
      outcomeResolutionDef,
      dataSources,
      defaults: template.defaults
    };
  }

  /**
   * Get pandascore videogames via proxy.
   */
  public async getPandascoreVideogames(context: any) {
    const apiProxyPrefix = this.getApiProxyPrefix();
    const url = `${apiProxyPrefix}pandascore/videogames?per_page=100`;

    try {
      const response = await axios.get(url, {
        headers: {
          'x-api-key': env.PROXY_API_KEY
        }
      });
      return response.data;
    } catch (error: any) {
      throw new CodeException({
        code: 'PANDASCORE_PROXY_ERROR',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        sourceFunction: `${this.constructor.name}/getPandascoreVideogames`,
        errorMessage: error?.message || 'Failed to fetch videogames from proxy',
        context
      });
    }
  }

  /**
   * Get pandascore matches for a league via proxy.
   */
  public async getPandascoreMatches(leagueId: string, context: any) {
    const apiProxyPrefix = this.getApiProxyPrefix();
    const baseUrl = `${apiProxyPrefix}pandascore/leagues/${encodeURIComponent(leagueId)}/matches`;

    try {
      const response = await axios.get(baseUrl, {
        params: {
          sort: 'begin_at',
          'filter[status]': 'not_started,running'
        },
        paramsSerializer: (params) => new URLSearchParams(params).toString(),
        headers: {
          'x-api-key': env.PROXY_API_KEY
        }
      });
      return response.data;
    } catch (error: any) {
      throw new CodeException({
        code: 'PANDASCORE_PROXY_ERROR',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        sourceFunction: `${this.constructor.name}/getPandascoreMatches`,
        errorMessage: error?.message || 'Failed to fetch matches from proxy',
        context
      });
    }
  }

  /**
   * Replace placeholders in template string.
   */
  private replacePlaceholders(template: string, replacements: Record<string, any>): string {
    let result = template;
    for (const [key, value] of Object.entries(replacements)) {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), String(value));
    }
    return result;
  }

  /**
   * Get API proxy prefix based on environment.
   */
  private getApiProxyPrefix(): string {
    const isDev = env.APP_ENV === AppEnvironment.DEV || env.APP_ENV === AppEnvironment.LOCAL_DEV;
    return isDev ? 'https://api-proxy-dev.ignitemarket.xyz/' : 'https://api-proxy.ignitemarket.xyz/';
  }
}
