/** src/errors/BadRequestError **/

import { CustomError } from "./CustomError";

export default class ServerRequestError extends CustomError {
  private static readonly _statusCode = 500;
  private readonly _code: number;
  private readonly _logging: boolean;
  private readonly _context: { [key: string]: any };

  constructor(params?: {code?: number, message?: string, logging?: boolean, context?: { [key: string]: any }}) {
    const { code, message, logging } = params || {};
    
    super(message ?? "Server Error");
    this._code = code ?? ServerRequestError._statusCode;
    this._logging = logging || false;
    this._context = params?.context || {};

    Object.setPrototypeOf(this, ServerRequestError.prototype);
  }

  get errors() {
    return [{ message: this.message, context: this._context }];
  }

  get statusCode() {
    return this._code;
  }

  get logging() {
    return this._logging;
  }
}