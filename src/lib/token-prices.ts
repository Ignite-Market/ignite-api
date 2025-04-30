import axios from 'axios';
import { env } from '../config/env';

/**
 * Gets token price from CoinGecko.
 *
 * @param tokenAddress Token address.
 * @returns Token price in USD.
 */
export async function getTokenPrice(tokenId: string): Promise<number> {
  const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
    params: {
      ids: tokenId,
      vs_currencies: 'usd'
    }
  });

  const data = response.data[tokenId];
  if (data) {
    return data.usd;
  } else {
    throw new Error('Token not found.');
  }
}
