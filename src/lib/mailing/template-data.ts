import { EmailTemplateType } from '../../config/types';

export function generateTemplateData(key: string, data: any) {
  const templateData = {
    [EmailTemplateType.EMAIL_VERIFICATION]: {
      subject: 'Verify your email address',
      title: 'Greetings to Ignite Market!',
      text: `
      <p>
        We just need to verify your email address to complete your account setup. Click the button below to verify your email address.
      </p>
      `,
      actionUrl: data.actionUrl,
      actionText: 'Verify your email',
      text2: `
      <p>
        If you need additional assistance, or you received this email in error, please contact us at <a href="mailto:ignitefmarket@gmail.com">ignitefmarket@gmail.com</a>.
        <br/><br/><br/>
        Cheers,<br/>
        The Ignite Market team
      </p>
      `,
    },
  };

  return templateData[key];
}
