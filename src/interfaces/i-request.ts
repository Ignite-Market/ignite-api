import type { Request } from 'express';
import { Context } from '../context';

export interface IRequest extends Request {
  context: Context;
  query: { [key: string]: undefined | string };
}
