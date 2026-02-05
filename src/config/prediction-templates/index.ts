import { btcPriceTemplate } from './btc-price.template';
import { flrPriceTemplate } from './flr-price.template';
import { xrpPriceTemplate } from './xrp-price.template';
import { hsiIndexTemplate } from './hsi-index.template';
import { sportsMatchTemplate } from './sports-match.template';

export const predictionTemplates = [btcPriceTemplate, flrPriceTemplate, xrpPriceTemplate, hsiIndexTemplate, sportsMatchTemplate];

export type PredictionTemplate = typeof btcPriceTemplate;
