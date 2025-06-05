import * as nodemailer from 'nodemailer';
import { Options, MailOptions } from 'nodemailer/lib/smtp-transport';
import { MailTemplates } from './mail-templates';
import { generateTemplateData } from './template-data';
import * as handlebars from 'handlebars';
import { Context } from '../../context';
import { env, getEnvSecrets } from '../../config/env';
import { writeLog } from '../logger';
import { AppEnvironment, LogType, ResourceNotFoundErrorCode, SystemErrorCode } from '../../config/types';
import { CodeException } from '../exceptions/exceptions';

export interface EmailData {
  templateName: string;
  mailFrom?: string;
  senderName?: string;
  mailAddresses: string[];
  subject: string;
  templateData: any;
  attachments?: any[];
  bccEmail?: string;
  attachmentTemplate?: string;
  attachmentFileName?: string;
}

/**
 * Send email via SMTP server
 *
 * @param {MailOptions} mail Email data.
 * @returns {Promise<boolean>} Tells if email was sent successfully.
 */
export async function SMTPsend(mail: MailOptions, context: Context): Promise<boolean> {
  await getEnvSecrets();

  // TODO: remove this
  if (env.APP_ENV === AppEnvironment.TEST) {
    console.log('SMTPsend - skipping email sending in test environment');
    return true;
  }

  const transportOptions = {
    pool: true,
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT == 465, // true for 465, false for other ports
    auth: {
      user: env.SMTP_USERNAME,
      pass: env.SMTP_PASSWORD
    }
  } as Options;

  const transporter = nodemailer.createTransport(transportOptions);

  try {
    const res = await transporter.sendMail(mail);

    if (res.accepted?.length) {
      writeLog(LogType.INFO, 'SMTPsendTemplate request - success', 'mailing/smtp-mailer', 'SMTPsend()');
      return true;
    }
    writeLog(
      LogType.ERROR,
      'SMTPsendTemplate request - failed',
      'lib/mailing/smtp-mailer',
      'SMTPsend()',
      new Error('SMTPsendTemplate request - failed')
    );
    return false;
  } catch (err) {
    throw new CodeException({
      code: SystemErrorCode.ERROR_SENDING_EMAIL,
      status: 500,
      context,
      sourceFunction: 'SMTPSend()',
      sourceModule: 'smtp-mailer',
      errorMessage: err.message,
      details: err
    });
  }
}

/**
 * Send email via SMTP server with template
 *
 * @param context Application context.
 * @param {EmailData} emailData Email data.
 * @returns {Promise<boolean>} Tells if email was sent successfully.
 */
export async function SMTPsendTemplate(context: Context, emailData: EmailData): Promise<boolean> {
  const template = MailTemplates.getTemplate(emailData.templateName);

  if (!template) {
    throw new CodeException({
      code: ResourceNotFoundErrorCode.TEMPLATE_NOT_FOUND,
      status: 404,
      context,
      sourceFunction: 'SMTPSendTemplate()',
      sourceModule: 'smtp-mailer'
    });
  }

  let { senderName, mailAddresses, subject } = emailData;
  const templateData = {
    APP_URL: env.APP_URL,
    ...emailData.templateData
  };

  if (env.APP_ENV === AppEnvironment.TEST) {
    mailAddresses = mailAddresses.filter((address) => address.includes('@kalmia.si'));
  }

  const mail = {
    from: `${senderName || env.SMTP_NAME_FROM}>`,
    to: mailAddresses.join(';'),
    subject,
    html: template(templateData),
    attachments: emailData.attachments || [],
    bcc: emailData.bccEmail
  };

  if (env.APP_ENV === AppEnvironment.TEST) {
    console.log('SMTPsendTemplate', mail);
    if (!mail.to) {
      return true;
    }
  }

  return await SMTPsend(mail, context);
}

/**
 * Send email via SMTP server with default template
 *
 * @param context Application context.
 * @param {EmailData} emailData Email data.
 * @returns {Promise<boolean>} Tells if email was sent successfully.
 */
export async function SMTPsendDefaultTemplate(context: Context, emailData: EmailData): Promise<boolean> {
  const header = MailTemplates.getTemplate('head');
  const footer = MailTemplates.getTemplate('footer');
  const body = MailTemplates.getTemplate('body');

  handlebars.registerPartial('header', header({}));
  handlebars.registerPartial('footer', footer({}));

  if (!header || !footer || !body) {
    throw new CodeException({
      code: ResourceNotFoundErrorCode.TEMPLATE_NOT_FOUND,
      status: 404,
      context,
      sourceFunction: 'SMTPSendTemplate()',
      sourceModule: 'smtp-mailer'
    });
  }

  emailData.mailFrom = env.SMTP_EMAIL_FROM;
  let { templateName, senderName, mailAddresses } = emailData;
  const templateData = {
    APP_URL: env.APP_URL,
    ...generateTemplateData(templateName, emailData.templateData),
    ...emailData.templateData
  };

  if (env.APP_ENV === AppEnvironment.TEST) {
    mailAddresses = mailAddresses.filter((address) => address.includes('@kalmia.si'));
  }

  const mail = {
    from: `${senderName || env.SMTP_NAME_FROM} <${env.SMTP_EMAIL_FROM}>`,
    to: mailAddresses.join(';'),
    subject: templateData.subject,
    html: body(templateData),
    attachments: emailData.attachments || [],
    bcc: emailData.bccEmail
  };

  // if (emailData.attachmentTemplate) {
  //   const file = await generatePdfFromTemplate(emailData, templateData);
  //   mail.attachments.push(file);
  // }

  if (env.APP_ENV === AppEnvironment.TEST) {
    console.log('SMTPsendDefaultTemplate', mail);
    if (!mail.to) {
      return true;
    }
  }
  return await SMTPsend(mail, context);
}

/**
 * Verify connection with SMTP server
 * @returns {Promise<boolean>}
 */
export async function SMTPverify(): Promise<boolean> {
  await getEnvSecrets();
  const transporter = nodemailer.createTransport({
    pool: true,
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT == 465, // true for 465, false for other ports
    auth: {
      user: env.SMTP_USERNAME,
      pass: env.SMTP_PASSWORD
    }
  } as Options);

  try {
    await transporter.verify();
  } catch (err) {
    writeLog(LogType.ERROR, `SMTP mailer error: ${err}`);
    throw err;
  }

  return true;
}

// async function generatePdfFromTemplate(
//   emailData: EmailData,
//   templateData: any
// ): Promise<{ filename: string; content: Buffer }> {
//   const attachmentTemplate = MailTemplates.getTemplate(
//     emailData.attachmentTemplate
//   )(templateData);

//   try {
//     const pdfUrl = await new GeneratePdfMicroservice(null).generatePdf(
//       attachmentTemplate
//     );
//     // Fetch the file content using Axios
//     const response = await axios.get(pdfUrl, {
//       responseType: 'arraybuffer',
//     });

//     return {
//       filename: emailData.attachmentFileName,
//       content: Buffer.from(response.data),
//     };
//   } catch (err) {
//     await new Lmas().writeLog({
//       logType: LogType.ERROR,
//       location: 'smtp-mailer/SMTPsendDefaultTemplate',
//       message: `Error generating PDF attachment from HTML: ${err}`,
//       data: { ...templateData },
//       sendAdminAlert: true,
//     });
//     throw err;
//   }
// }
