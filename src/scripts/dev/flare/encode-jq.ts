import { keccak256, solidityPacked } from 'ethers';
import { exit } from 'process';

const url = 'https://vuqzmpatojlcqvqcc6n7v4grmy0pjqpi.lambda-url.us-east-1.on.aws/?apiId=1742468060141';
const jq = '.result';

(async () => {
  const packed = solidityPacked(['string', 'string'], [url, jq]);
  const jqKey = keccak256(packed);

  console.log(jqKey);

  exit(0);
})().catch(async (err) => {
  console.log(err);
  exit(1);
});
