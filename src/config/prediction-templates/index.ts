import { btcPriceTemplate } from './btc-price.template';
import { xrpPriceTemplate } from './xrp-price.template';
import { hsiIndexTemplate } from './hsi-index.template';

export const predictionTemplates = [btcPriceTemplate, xrpPriceTemplate, hsiIndexTemplate];

export type PredictionTemplate = typeof btcPriceTemplate;
