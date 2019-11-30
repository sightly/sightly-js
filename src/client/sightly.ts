import { Sightly } from '../common/types';
import LoggerClient from './logger';
import Core from '../common/core';

export default class SightlyClient {

  protected _core = Core.instance;
  protected _token: string;

  constructor(frontendToken: string) {

    this._token = frontendToken;

    // Establish connection
    this._core.logsConnect(this._token);

  }

  /**
  * Returns a new logger instance.
  * @param options Logger options.
  */
  public logger(options?: Sightly.LoggerOptions): LoggerClient {

    return new LoggerClient({
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

  /**
  * Reconnects to the server if connection is closed.
  */
  public reconnect() {

    this._core.logsConnect(this._token);

  }

  /**
  * Closes the connection to the server when all remaining logs are sent
  * (e.g. if connection is temporarily dropped, the client tries to reconnect. Meanwhile, all unsent and new logs are cached in the background, waiting for the connection to be re-established).
  * @param force If true, the connection will be closed regardless of the cached logs.
  * <strong>WARNING: Using this flag might result in losing unsent logs!</strong>
  */
  public close(force?: boolean) {

    return this._core.logsDisconnect(this._token, force);

  }

}
