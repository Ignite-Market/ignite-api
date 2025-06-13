import { env, exit } from 'process';
import { EmailTemplateType } from '../../config/types';
import { SMTPsendDefaultTemplate } from '../../lib/mailing/smtp-mailer';
import { createContext } from '../../lib/utils';

const EMAIL = 'anze.mur@kalmia.si';
const TOKEN = '1234567890';

(async () => {
  const context = await createContext();

  await SMTPsendDefaultTemplate(context, {
    templateName: EmailTemplateType.EMAIL_VERIFICATION,
    mailAddresses: [EMAIL],
    subject: 'Email verification',
    templateData: {
      actionUrl: `${env.APP_URL}/confirm-email?token=${TOKEN}`
    }
  });

  await context.mysql.close();
  exit(0);
})().catch(async (err) => {
  console.log(err);
  exit(1);
});
