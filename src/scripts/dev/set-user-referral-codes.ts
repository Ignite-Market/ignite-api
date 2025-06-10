import { exit } from 'process';
import { createContext } from '../../lib/utils';
import { User } from '../../modules/user/models/user.model';
import { DbTables, PopulateFrom, SerializeFor } from '../../config/types';
import * as nanoid from 'nanoid';

/**
 * Script to set referralId = nanoid(12) for all users
 */
(async () => {
  // Dynamically import nanoid
  const start = new Date();
  console.log('Starting to set referral ids for all users...');

  // Create context
  const context = await createContext();

  try {
    // Get all users from the database
    const query = `SELECT * FROM ${DbTables.USER} WHERE status = 5 AND referralId IS NULL;`;
    const users = await context.mysql.paramExecute(query);

    console.log(`Found ${users.length} users to update.`);

    // Loop through each user and set a new referral id
    let updatedCount = 0;
    for (const userData of users) {
      const user = new User({}, context);
      user.populate(userData, PopulateFrom.DB);

      // Generate a new referral id
      user.referralId = nanoid.nanoid(12);

      // Update the user in the database
      await user.update(SerializeFor.UPDATE_DB);

      updatedCount++;

      if (updatedCount % 100 === 0) {
        console.log(`Updated ${updatedCount} users so far...`);
      }
    }

    console.log(`Successfully updated referral ids for ${updatedCount} users.`);
  } catch (error) {
    console.error('Error updating user referral ids:', error);
    exit(1);
  } finally {
    // Close the database connection
    await context.mysql.close();

    const end = new Date();
    console.log('Duration: ', (end.getTime() - start.getTime()) / 1000, 's');
    exit(0);
  }
})().catch(async (err) => {
  console.error('Unhandled error:', err);
  exit(1);
});
