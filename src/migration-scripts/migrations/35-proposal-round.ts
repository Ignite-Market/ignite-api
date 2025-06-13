import { DbTables, SqlModelStatus } from '../../config/types';
import { ProposalRoundStatus } from '../../modules/proposal/models/proposal-round.model';

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
  CREATE TABLE IF NOT EXISTS \`${DbTables.PROPOSAL_ROUND}\` (
    \`id\` INT NOT NULL AUTO_INCREMENT,
    \`rewardPoints\` INT NOT NULL,
    \`startTime\` DATETIME NOT NULL,
    \`endTime\` DATETIME NOT NULL,
    \`roundStatus\` INT NOT NULL DEFAULT '${ProposalRoundStatus.INITIALIZED}',
    \`winner_id\` INT NULL,
    \`status\` INT NOT NULL DEFAULT '${SqlModelStatus.ACTIVE}',
    \`createTime\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`createUser\` INT NULL,
    \`updateTime\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    \`updateUser\` INT NULL,
    PRIMARY KEY (\`id\`));
  `);
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    DROP TABLE IF EXISTS \`${DbTables.PROPOSAL_ROUND}\`;
  `);
}
