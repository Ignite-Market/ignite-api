import { ethers } from 'ethers';
import { exit } from 'process';
import { env } from '../../config/env';
import { setup } from '../../lib/blockchain';

const FPMM_CONTRACT = '0xD0cB875863f339068D4c20584b14fdED32B198e8';

(async () => {
  const { signer } = setup();

  const conditionalTokenContract = new ethers.Contract(
    env.CONDITIONAL_TOKEN_CONTRACT,
    [
      'function approve(address spender, uint256 value) public returns (bool)',
      'function allowance(address owner, address spender) external view returns (uint256)'
    ],
    signer
  );

  const allowance = await conditionalTokenContract.allowance(signer.address, FPMM_CONTRACT);
  console.log(allowance);
  if (allowance < ethers.parseUnits('1000000', 'ether')) {
    const approveTx = await conditionalTokenContract.approve(FPMM_CONTRACT, ethers.MaxUint256);
    await approveTx.wait();
  }
  exit(0);
})().catch(async (error) => {
  console.log(JSON.stringify(error, null, 2));
  exit(1);
});
