import { CollateralToken } from '../../modules/collateral-token/models/collateral-token.model';
import { createContext } from './context';

const uscd = {
  name: 'USDC',
  symbol: 'USDC',
  address: '0x822139B372dbFc063470Ae0d2361d9550838BB49',
  decimals: 6,
  fundingThreshold: '200',
  imgUrl: 'https://images.ignitemarket.xyz/tokens/usdc.svg'
};

const fxrp = {
  name: 'Flare Ripple',
  symbol: 'FXRP',
  address: '0x6d9b52e4703641831B352954b82929491810C223',
  decimals: 6,
  fundingThreshold: '200',
  imgUrl: 'https://images.ignitemarket.xyz/tokens/fxrp.svg'
};

const addContract = async () => {
  const context = await createContext();

  try {
    const usdcToken = await new CollateralToken(uscd, context).insert();
    console.log(usdcToken.serialize());

    const fxrpToken = await new CollateralToken(fxrp, context).insert();
    console.log(fxrpToken.serialize());
  } catch (error) {
    console.log(error);

    await context.mysql.close();
    return;
  }

  await context.mysql.close();
};

addContract()
  .then(() => {
    console.log('Complete!');
    process.exit(0);
  })
  .catch(console.error);
