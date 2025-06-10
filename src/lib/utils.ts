import { decode, sign, verify } from 'jsonwebtoken';
import * as _ from 'lodash';
import { env, getEnvSecrets } from '../config/env';
import { AppEnvironment } from '../config/types';
import { Context } from '../context';
import { MySql } from './database/mysql';

/**
 * Checks if a variable is a plain object.
 *
 * @param testVar The variable to check.
 * @returns True if the variable is a plain object, false otherwise.
 */
export function isPlainObject(testVar: any): boolean {
  if (testVar === null || testVar === undefined || typeof testVar !== 'object' || Array.isArray(testVar) || typeof testVar?.getMonth === 'function') {
    return false;
  }
  return true;
}

/**
 * Converts a stream to a string.
 *
 * @param stream The stream to convert.
 * @param encoding The encoding to use.
 * @returns A promise that resolves to the string.
 */
export async function streamToString(stream: any, encoding: BufferEncoding): Promise<string> {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk: any) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err: any) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString(encoding)));
  });
}

/**
 * Runs tasks in parallel with workers
 *
 * @param {Array<any>} data array of data for tasks.
 * @param {number} workerCount number of parallel workers
 * @param {any} ctx
 * @param {(doc, ctx) => void} task task function gets document/element from array an context in params
 */
export async function runWithWorkers(data: Array<any>, workerCount: number, ctx: any, task: (doc, ctx) => void) {
  for (let i = 0; i < data.length; i++) {
    const workers = [];
    console.log(`COMPLETED=${i}/${data.length}`);
    for (let j = 0; j < workerCount; j++) {
      if (i >= data.length) {
        break;
      }
      const wDoc = data[i];
      const worker = async () => {
        const doc = _.cloneDeep(wDoc);
        await task.call(this, doc, ctx);
      };
      workers.push(worker());
      i++;
    }
    i--;
    if (workers.length) {
      await Promise.all(workers);
    }
  }
  console.log(`COMPLETED=${data.length}/${data.length}`);
}

/**
 * Converts a date to an object ID.
 *
 * @param date The date to convert.
 * @returns The object ID.
 */
export function objectIdFromDate(date: Date) {
  return Math.floor(date.getTime() / 1000).toString(16) + '0000000000000000';
}

/**
 * Converts an object to a JSON string.
 *
 * @param obj The object to convert.
 * @returns The JSON string.
 */
export function stringifyBigInt(obj: any) {
  return JSON.stringify(obj, (_, value) => (typeof value === 'bigint' ? value.toString() : value), 2);
}

/**
 * Converts an object ID to a date.
 *
 * @param objectId The object ID to convert.
 * @returns The date.
 */
export function dateFromObjectId(objectId: string) {
  return new Date(parseInt(objectId.substring(0, 8), 16) * 1000);
}

/**
 * Converts a date to a Unix timestamp.
 *
 * @param date The date to convert.
 * @returns The Unix timestamp.
 */
export function toUnixTimestamp(date: Date) {
  return !!date ? Math.floor(date.getTime() / 1000) : 0;
}

/**
 * Parses a JSON string safely.
 *
 * @param inputString The JSON string to parse.
 * @param defaultResult The default result to return if parsing fails.
 * @returns The parsed JSON object or the default result.
 */
export function safeJsonParse(inputString: string, defaultResult = null) {
  try {
    defaultResult = JSON.parse(inputString);
  } catch (err) {
    // console.warn('JSON parse failed and was handled by default value.');
  }
  return defaultResult;
}

/**
 * Checks if an email is valid.
 *
 * @param email The email to check.
 * @returns True if the email is valid, false otherwise.
 */
export function checkEmail(email: string) {
  const regex =
    // eslint-disable-next-line security/detect-unsafe-regex
    /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/g;
  return regex.test(email);
}

/**
 * Generates a JWT token.
 *
 * @param subject The subject of the token.
 * @param data The data to include in the token.
 * @param expiresIn The expiration time of the token.
 * @param secret The secret key to use for the token.
 * @returns The generated JWT token.
 */
export function generateJwtToken(subject: string, data: object, expiresIn = '1d', secret?: string) {
  if (!subject && !expiresIn) {
    return sign({ ...data }, secret ? secret : env.APP_SECRET);
  } else if (expiresIn == 'never') {
    return sign({ ...data }, secret ? secret : env.APP_SECRET, {
      subject
    });
  }
  return sign({ ...data }, secret ? secret : env.APP_SECRET, {
    subject,
    expiresIn
  });
}

/**
 * Parses a JWT token.
 *
 * @param subject The subject of the token.
 * @param token The token to parse.
 * @param secret The secret key to use for the token.
 * @returns The parsed JWT token.
 */
export function parseJwtToken(subject: string, token: string, secret?: string) {
  return verify(token, secret ? secret : env.APP_SECRET, { subject }) as any;
}

/**
 * Decodes a JWT token.
 *
 * @param token The token to decode.
 * @returns The decoded JWT token.
 */
export function decodeJwtToken(token: string) {
  return decode(token) as any;
}

/**
 * Generates a random password.
 *
 * @param length The length of the password.
 * @returns The generated password.
 */
export function generatePassword(length: number) {
  return generateRandomString(length, true);
}

/**
 * Generates a random string.
 *
 * @param length The length of the string.
 * @returns The generated string.
 */
export function generateRandomString(length: number, includeSpecialChars = false) {
  const specialChars = '@#$&*€%';
  let charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

  if (includeSpecialChars) {
    charset = charset + specialChars;
  }

  let str = '';
  for (let i = 0, n = charset.length; i < length; ++i) {
    str += charset.charAt(Math.floor(Math.random() * n));
  }
  return str;
}

/**
 * Converts a date to a SQL string.
 *
 * @param date The date to convert.
 * @returns The SQL string.
 */
export function dateToSqlString(date: Date): string {
  return date.toISOString().replace(/T/, ' ').replace(/Z/, '');
}

// // DO NOT SET RETURN TYPE AS IT WILL MESS WITH CI/CD BUILD!
// export function getFaker() {
//   // eslint-disable-next-line @typescript-eslint/no-var-requires
//   return require('@faker-js/faker').faker;
// }
// export function getEnumKey<TEnum>(
//   enumerator: TEnum,
//   value: TEnum[keyof TEnum]
// ): string | TEnum[keyof TEnum] {
//   return Object.keys(enumerator).find((key) => enumerator[key] === value);
// }

/**
 * Gets the arguments from the command line.
 *
 * @returns The arguments from the command line.
 */
export function getArgs() {
  return process.argv.reduce((args, arg) => {
    // long arg
    if (arg.slice(0, 2) === '--') {
      const longArg = arg.split('=');
      const longArgFlag = longArg[0].slice(2);
      const longArgValue = longArg.length > 1 ? longArg[1] : true;
      args[longArgFlag] = longArgValue;
    }
    // flags
    else if (arg[0] === '-') {
      const flags = arg.slice(1).split('');
      flags.forEach((flag) => {
        args[flag] = true;
      });
    }
    return args;
  }, {}) as any;
}

/**
 * Split array into multiple arrays (chunks)
 * @param arr source array
 * @param splitBy num of elements in chunk
 * @returns
 */
export function splitArray<T>(arr: T[], splitBy: number): T[][] {
  const cache = [];
  const tmp = [...arr];
  while (tmp.length) {
    cache.push(tmp.splice(0, splitBy));
  }
  return cache;
}

/**
 * Creates context with MySQL connection.
 *
 * @returns The context.
 */
export async function createContext(): Promise<Context> {
  await getEnvSecrets();

  const options = {
    host: env.APP_ENV === AppEnvironment.TEST ? env.MYSQL_HOST_TEST : env.MYSQL_HOST,
    port: env.APP_ENV === AppEnvironment.TEST ? env.MYSQL_PORT_TEST : env.MYSQL_PORT,
    database: env.APP_ENV === AppEnvironment.TEST ? env.MYSQL_DATABASE_TEST : env.MYSQL_DATABASE,
    user: env.APP_ENV === AppEnvironment.TEST ? env.MYSQL_USER_TEST : env.MYSQL_USER,
    password: env.APP_ENV === AppEnvironment.TEST ? env.MYSQL_PASSWORD_TEST : env.MYSQL_PASSWORD
  };

  const mysql = new MySql(options);
  await mysql.connect();
  const context = new Context();
  context.setMySql(mysql);

  return context;
}
