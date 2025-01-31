import { env } from '../../config/env';
import { DbTables } from '../../config/types';
import { Contract, ContractId } from '../../modules/contract/models/contract.model';
import { createContext } from './context';

const contractId = ContractId.FPMM_FACTORY;
const contractAddress = '0x88436658f14A7cA6CE18C514A7af605Bb6329Bb7';
const deployedBlock = 21238203;
const parseBlocks = env.FPMM_FACTORY_PARSE_BLOCK_SIZE;

const addContract = async () => {
  const context = await createContext();

  try {
    await context.mysql.paramExecute(`
      INSERT INTO ${DbTables.CONTRACT}
      (
        id,
        name,
        contractAddress,
        lastProcessedBlock,
        parseBlockSize
      )
      VALUES
      (${contractId}, '${ContractId[contractId]}', '${contractAddress}', ${deployedBlock}, ${parseBlocks})
  `);

    const contract = await new Contract({}, context).populateById(contractId);
    console.log(contract.serialize());
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
