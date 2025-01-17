import { ethers } from 'ethers';
import { exit } from 'process';
import { setup } from '../../lib/blockchain';

const FPMM_CONTRACT = '0xD0cB875863f339068D4c20584b14fdED32B198e8';

(async () => {
  const { signer, conditionalTokenContract } = setup();

  const isApproved = await conditionalTokenContract.isApprovedForAll(signer.address, FPMM_CONTRACT);
  if (!isApproved) {
    const approveTx = await conditionalTokenContract.approve(FPMM_CONTRACT, ethers.MaxUint256);
    await approveTx.wait();
  }
  exit(0);
})().catch(async (error) => {
  console.log(JSON.stringify(error, null, 2));
  exit(1);
});
