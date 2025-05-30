import { exit } from 'process';
import { prepareAttestationRequest } from '../../../lib/flare/attestation';

// const endpoint = 'https://swapi.info/api/people/3';
// const jqQuery = `{name: .name, height: .height, mass: .mass, numberOfFilms: .films | length, uid: (.url | split("/") | .[-1] | tonumber)}`;
// const abi = `{"components": [{"internalType": "string", "name": "name", "type": "string"},{"internalType": "uint256", "name": "height", "type": "uint256"},{"internalType": "uint256", "name": "mass", "type": "uint256"},{"internalType": "uint256", "name": "numberOfFilms", "type": "uint256"},{"internalType": "uint256", "name": "uid", "type": "uint256"}],"name": "task","type": "tuple"}`;
// const endpoint = 'https://mock-api.ignitemarket.xyz/api1';

const endpoint = 'https://mock-api.ignitemarket.xyz/api3/1';
const jqQuery = `{ "outcomeIdx": .result }`;
const abi = {
  'components': [
    {
      'internalType': 'uint256',
      'name': 'outcomeIdx',
      'type': 'uint256'
    }
  ],
  'type': 'tuple'
};

const httpMethod = 'GET';
const body = {};
const queryParams = {};

(async () => {
  const attestationRequest = await prepareAttestationRequest(endpoint, jqQuery, abi, httpMethod, body, queryParams);
  console.log(JSON.stringify(attestationRequest, null, 2));
  exit(0);
})().catch(async (err) => {
  console.log(err);
  exit(1);
});
