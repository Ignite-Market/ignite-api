import { DbTables, SqlModelStatus } from '../../config/types';
import { ProposalVoteType } from '../../modules/proposal/models/proposal-vote.model';

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
  CREATE TABLE IF NOT EXISTS \`${DbTables.PROPOSAL_VOTE}\` (
    \`id\` INT NOT NULL AUTO_INCREMENT,
    \`proposal_id\` INT NOT NULL,
    \`user_id\` INT NOT NULL,
    \`voteType\` INT NOT NULL DEFAULT '${ProposalVoteType.UPVOTE}',
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
    DROP TABLE IF EXISTS \`${DbTables.PROPOSAL_VOTE}\`;
  `);
}
