import axios from 'axios';

/**
 * Gets token price from CoinGecko.
 *
 * @param tokenId Token ID.
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
