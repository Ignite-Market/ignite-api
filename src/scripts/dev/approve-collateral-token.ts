import { ethers } from 'ethers';
import { exit } from 'process';
import { env } from '../../config/env';
import { setup } from '../../lib/blockchain';

const FPMM_CONTRACT = '0xd64Bacbfe73361b6b3eB4C2D7125a51E26837569';

(async () => {
  const { signer } = setup();

  const collateralTokenContract = new ethers.Contract(
    env.COLLATERAL_TOKEN_CONTRACT,
    [
      'function approve(address spender, uint256 value) public returns (bool)',
      'function allowance(address owner, address spender) external view returns (uint256)'
    ],
    signer
  );

  const allowance = await collateralTokenContract.allowance(signer.address, FPMM_CONTRACT);
  if (allowance < ethers.parseUnits('1000000', 'ether')) {
    const approveTx = await collateralTokenContract.approve(FPMM_CONTRACT, ethers.MaxUint256);
    await approveTx.wait();
  }
  exit(0);
})().catch(async (err) => {
  console.log(err);
  exit(1);
});
