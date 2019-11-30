import { Sightly } from '../common/types';
import LoggerAdmin from './logger';
import SightlyClient from '../client/sightly';

export default class SightlyAdmin extends SightlyClient {

  constructor(backendToken: string) {

    super(backendToken);

  }

  /**
  * Returns a new admin logger instance.
  * @param options Logger options.
  */
  public logger(options?: Sightly.LoggerOptions): LoggerAdmin {

    return new LoggerAdmin({
      consoleLogs: ! options?.hasOwnProperty('consoleLogs') ? true : !! options.consoleLogs,
      colorfulConsoleLogs: ! options?.hasOwnProperty('colorfulConsoleLogs') ? true : !! options.colorfulConsoleLogs,
      structuredConsoleLogs: ! options?.hasOwnProperty('structuredConsoleLogs') ? true : !! options.structuredConsoleLogs,
      captureErrors: !! options?.captureErrors,
      channel: options?.channel || 'default',
      queueSize: options?.queueSize || Infinity,
      tags: [],
      token: this._token
    });

  }

}
