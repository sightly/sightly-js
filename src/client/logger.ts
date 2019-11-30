import { Sightly } from '../common/types';
import LogsQueue from '../common/queue';
import Core from '../common/core';

export default class LoggerClient {

  protected _core = Core.instance;
  protected _socket: SocketIOClient.Socket;
  protected _queue: LogsQueue;
  protected _queueSize: number;
  protected _tags: string[];
  protected _channel: string;
  protected _token: string;
  protected _consoleLogs: boolean;
  protected _colorfulConsoleLogs: boolean;
  protected _structuredConsoleLogs: boolean;

  constructor(options: Sightly.LoggerOptionsExtended) {

    this._queueSize = options.queueSize;
    this._queue = options.queue || new LogsQueue(this._queueSize);
    this._tags = options.tags;
    this._channel = options.channel;
    this._token = options.token;
    this._socket = this._core.getLogsSocket(this._token);
    this._consoleLogs = options.consoleLogs;
    this._colorfulConsoleLogs = options.colorfulConsoleLogs;
    this._structuredConsoleLogs = options.structuredConsoleLogs;

    // If not invoked by this.tag
    if ( ! this._tags.length ) {

      // Capture console.errors if asked
      if ( options.captureErrors ) {

        this._core.onConsoleError((...args: any[]) => {

          if ( ! args.length ) return;

          this.tag('captured').error(args[0], ...args.slice(1));

        });

      }

      // Register queue in core
      // this._core.registerQueue(this._token, this._queue);

      // Send all logs in the queue uppon successful connection
      this._socket.on('connect', () => {

        while ( ! this._queue.empty ) {

          this._sendLog(this._queue.pull());

        }

      });

    }


  }

  /**
  * Sends the log to the server if socket is connected and queues the log otherwise.
  * @param log An internal log object.
  */
  protected _sendLog(log: Sightly.InternalLogObject) {

    if ( ! log ) return;

    if ( this._socket.connected ) this._socket.emit('log', log);
    else this._queue.push(log);

  }

  /**
  * Builds and returns an internal log object.
  * Also logs to console if enabled.
  * @param level The level of the log.
  * @param logs An array of log messages.
  */
  protected _buildInternalLog(level: 'debug'|'info'|'notice'|'warn'|'error', logs: Sightly.Log[]): Sightly.InternalLogObject {

    const time = Date.now();

    // Log to console
    if ( this._consoleLogs ) this._core.logToConsole(time, logs, level, this._structuredConsoleLogs, this._colorfulConsoleLogs);

    return {
      tags: this._tags.length ? this._tags : undefined,
      channel: this._channel,
      time: time,
      // Convert errors to normal objects
      messages: logs.map(log => {

        if ( ! (log instanceof Error) ) return log;

        const json: any = {};

        for ( const key of Object.getOwnPropertyNames(log) ) {

          json[key] = log[key];

        }

        return json;

      }),
      level: level
    };

  }

  /**
  * Sets a list of tags.
  * @param tags Tags to set for the log.
  */
  public tag(...tags: string[]): LoggerClient {

    if ( ! tags.length ) return this;

    return new LoggerClient({
      channel: this._channel,
      queue: this._queue,
      queueSize: this._queueSize,
      tags: this._tags.concat(tags),
      token: this._token,
      consoleLogs: this._consoleLogs,
      colorfulConsoleLogs: this._colorfulConsoleLogs,
      structuredConsoleLogs: this._structuredConsoleLogs
    });

  }

  /**
  * Sends a log at the debug level.
  * @param log The log message.
  * @param additionalLogs Additional messages to include in this log.
  */
  public debug(log: Sightly.Log, ...additionalLogs: Sightly.Log[]): LoggerClient {

    this._sendLog(this._buildInternalLog('debug', [log, ...additionalLogs]));
    return this;

  }

  /**
  * Sends a log at the info level.
  * @param log The log message.
  * @param additionalLogs Additional messages to include in this log.
  */
  public info(log: Sightly.Log, ...additionalLogs: Sightly.Log[]): LoggerClient {

    this._sendLog(this._buildInternalLog('info', [log, ...additionalLogs]));
    return this;

  }

  /**
  * Sends a log at the notice level.
  * @param log The log message.
  * @param additionalLogs Additional messages to include in this log.
  */
  public notice(log: Sightly.Log, ...additionalLogs: Sightly.Log[]): LoggerClient {

    this._sendLog(this._buildInternalLog('notice', [log, ...additionalLogs]));
    return this;

  }

  /**
  * Sends a log at the warn level.
  * @param log The log message.
  * @param additionalLogs Additional messages to include in this log.
  */
  public warn(log: Sightly.Log, ...additionalLogs: Sightly.Log[]): LoggerClient {

    this._sendLog(this._buildInternalLog('warn', [log, ...additionalLogs]));
    return this;

  }

  /**
  * Sends a log at the error level.
  * @param log The log message.
  * @param additionalLogs Additional messages to include in this log.
  */
  public error(log: Sightly.Log, ...additionalLogs: Sightly.Log[]): LoggerClient {

    this._sendLog(this._buildInternalLog('error', [log, ...additionalLogs]));
    return this;

  }

}
