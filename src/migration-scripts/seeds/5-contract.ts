import { DbTables } from '../../config/types';
import { ContractId } from '../../modules/contract/models/contract.model';
import { WorkerName } from '../../workers/worker-executor';

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    INSERT INTO ${DbTables.CONTRACT} (
      \`id\`,	
      \`name\`,
      \`contractAddress\`,
      \`lastProcessedBlock\`,
      \`parseBlockSize\`,
      \`status\`
      )
      VALUES
      (${ContractId.FPMM_FACTORY}, '${ContractId[ContractId.FPMM_FACTORY]}', '0xCcf7B6AC95D7466A70322D2363cc2C97C81fbe0B', 44035188, 1023, 5),
      (${ContractId.IGNITE_ORACLE}, '${ContractId[ContractId.IGNITE_ORACLE]}', '0xb085A9E2defe1E1c0C33DdF2475376EcC89D0679', 44035188, 1023, 5),
      (${ContractId.CONDITIONAL_TOKENS}, '${ContractId[ContractId.CONDITIONAL_TOKENS]}', '0xC3C077A248e36418eA9CC23A684aBf8677C09B58', 44035188, 1023, 5)
  `);
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    DELETE FROM ${DbTables.CONTRACT} WHERE id IN (${ContractId.FPMM_FACTORY}, ${ContractId.IGNITE_ORACLE}, ${ContractId.CONDITIONAL_TOKENS});
  `);
}
