import { env } from '../../config/env';
import { DbTables } from '../../config/types';
import { Contract, ContractId } from '../../modules/contract/models/contract.model';
import { createContext } from './context';

const contractId = ContractId.CONDITIONAL_TOKENS;
const contractAddress = '0x3c1947f48BAA623B264e86cF1ac85AE3FCd09904';
const deployedBlock = 15666307;
const parseBlocks = env.CONDITIONAL_TOKENS_PARSE_BLOCK_SIZE;

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
