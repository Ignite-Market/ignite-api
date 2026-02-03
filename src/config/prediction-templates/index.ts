import { btcPriceTemplate } from './btc-price.template';
import { xrpPriceTemplate } from './xrp-price.template';
import { hsiIndexTemplate } from './hsi-index.template';
import { sportsMatchTemplate } from './sports-match.template';

export const predictionTemplates = [btcPriceTemplate, xrpPriceTemplate, hsiIndexTemplate, sportsMatchTemplate];

export type PredictionTemplate = typeof btcPriceTemplate;
