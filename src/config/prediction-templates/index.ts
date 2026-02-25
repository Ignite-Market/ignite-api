import { btcPriceTemplate } from './btc-price.template';
import { flrPriceTemplate } from './flr-price.template';
import { xrpPriceTemplate } from './xrp-price.template';
import { hsiIndexTemplate } from './hsi-index.template';
import { sportsMatchTemplate } from './sports-match.template';
import { esportsMatchTemplate } from './esports-match.template';

export const predictionTemplates = [
  btcPriceTemplate,
  flrPriceTemplate,
  xrpPriceTemplate,
  hsiIndexTemplate,
  sportsMatchTemplate,
  esportsMatchTemplate
];

export type PredictionTemplate = typeof btcPriceTemplate;
