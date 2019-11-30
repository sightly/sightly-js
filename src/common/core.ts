import io from 'socket.io-client';
import config from '../config.json';
import { Sightly } from './types';
import LogsQueue from './queue';
import chalk from 'chalk';

export default class Core {

  private static _instance: Core;
  private _sockets: Sightly.SocketRegistry = {};
  private _queues: Sightly.QueueRegistry = {};
  private _logListeners: Sightly.LogListeners = {};
  private _errorListeners: Function[] = [];
  private readonly _originalConsoleError: Function = console.error;

  /** Making this class a singleton. */
  private constructor() {

    // Wrap console.error
    if ( console?.error ) {

      console.error = (...args) => {

        this._originalConsoleError(...args);

        for ( const listener of this._errorListeners ) {

          listener(...args);

        }

      };

    }

  }

  public static get instance(): Core {

    if ( ! Core._instance ) Core._instance = new Core();

    return Core._instance;

  }

  /**
  * Creates a connection to the logs server and returns the socket (will return cached socket if connection is already established).
  * @param token The connection token.
  */
  public logsConnect(token: string) {

    if ( this._sockets[token] ) {

      // Reconnect if necessary
      if ( this._sockets[token].disconnected ) this._sockets[token].connect();

      return this._sockets[token];

    }

    const socket = io(config.logsServerHost, {
      path: config.logsServerSocketPath,
      autoConnect: true,
      query: { token: token }
    });

    // Establish connection
    socket
    .connect()
    .on('connect', () => {

      this.logToConsole(Date.now(), ['Sightly connected'], 'debug');

    })
    .on('disconnect', (reason: string) => {

      // Server disconnected the client (no reconnections)
      if ( reason === 'io server disconnect' ) {

        this.logToConsole(Date.now(), ['SIGHTLY_CONNECTION_ERROR', 'Server disconnected the client!'], 'error');

      }
      // Client disconnected (not manually)
      else if ( ! ['io client disconnect', 'forced close'].includes(reason) ) {

        this.logToConsole(Date.now(), ['SIGHTLY_CONNECTION_ERROR', 'Client was disconnected! Trying to reconnect...'], 'error');

      }

    })
    .on('log', (log: Sightly.LogObject) => {

      const listeners = this._logListeners[token];

      if ( ! listeners ) return;

      for ( const listener of listeners[log.level] ) {

        listener(log);

      }

      for ( const listener of listeners.all ) {

        listener(log);

      }

    })
    .on('error', (error: Error) => {

      this.logToConsole(Date.now(), ['SIGHTLY_CONNECTION_ERROR', error], 'error');

    });

    this._sockets[token] = socket;

    return socket;

  }

  /**
  * Closes a connection to the logs server..
  * @param token The connection token.
  * @param force Whether to close the connection without considering the remaining queued logs.
  */
  public logsDisconnect(token: string, force?: boolean): Promise<void> {

    return new Promise((resolve) => {

      // If no socket was registered with the given token
      if ( ! this._sockets[token] ) return resolve();

      // If forced disconnect or no queues registered
      if ( force || ! this._queues[token] ) {

        this._sockets[token].close();
        return resolve();

      }

      // Otherwise, wait for queues to be empty and then close the connection
      const results: boolean[] = this._queues[token].map(queue => queue.empty);
      const listeners: { queue: LogsQueue, empty: Function, push: Function }[] = [];
      // Function to close the socket when all queues are empty
      const closeSocket = () => {

        // Unregister all listeners
        for ( const listener of listeners ) {

          listener.queue.off('empty', listener.empty);
          listener.queue.off('push', listener.push);

        }

        // Close the connection
        this._sockets[token].close();
        resolve();

      };

      // If they are empty right now
      if ( results.every(result => result) ) return closeSocket();

      // Otherwise, wait on all queues
      for ( let i = 0; i < this._queues[token].length; i++ ) {

        // On-empty event handler
        const emptyCb = () => {

          results[i] = true;

          // Check all queues
          if ( results.every(result => result) ) closeSocket();

        };

        // On-push event handler
        const pushCb = () => {

          results[i] = false;

        };

        // Register queue and its handlers in the listeners array (for future reference)
        listeners[i] = { queue: this._queues[token][i], empty: emptyCb, push: pushCb };

        // Attach handlers to the queue
        this._queues[token][i].on('empty', emptyCb);
        this._queues[token][i].on('push', pushCb);

      }

    });

  }

  /**
  * Returns the cached socket by token.
  * @param token The connection token.
  */
  public getLogsSocket(token: string) {

    return this._sockets[token];

  }

  /**
  * Registers a logs queue (used for waiting on the queue before closing the connection).
  * @param token The connection token.
  * @param queue The logs queue.
  */
  public registerQueue(token: string, queue: LogsQueue) {

    if ( ! this._queues[token] ) this._queues[token] = [];

    this._queues[token].push(queue);

  }

  /**
  * Registers a listener to all logs at a certain level.
  * @param listener The listener function.
  * @param level The log level.
  * @param token The connection token.
  */
  public registerLogListener(listener: Function, level: string, token: string) {

    if ( ! this._logListeners[token] ) this._logListeners[token] = { debug: [], info: [], notice: [], warn: [], error: [], all: [] };

    this._logListeners[token][level].push(listener);

  }

  /**
  * Unregisters a log listener at a certain level.
  * @param listener The listener function.
  * @param level The log level.
  * @param token The connection token.
  */
  public unregisterLogListener(listener: Function, level: string, token: string) {

    if ( ! this._logListeners[token] ) return;

    const index = this._logListeners[token][level].indexOf(listener);

    if ( index > -1 ) this._logListeners[token][level].splice(index, 1);

  }

  /**
  * Calls the callback whenever console.error has been called.
  * @param cb The callback.
  */
  public onConsoleError(cb: Function) {

    this._errorListeners.push(cb);

  }

  /**
  * Logs to console.
  * @param time The log's timestamp.
  * @param logs An array of log messages.
  * @param level Log level.
  * @param structured Structured logs.
  * @param colorful Colorful logs.
  */
  public logToConsole(time: number, logs: Sightly.Log[], level: string, structured: boolean = true, colorful: boolean = true) {

    const colors = {
      debug: 'gray',
      info: 'white',
      notice: 'magenta',
      warn: 'yellow',
      error: 'redBright'
    };

    let consoleReady: any[] = [];

    if ( structured ) {

      if ( colorful )
        consoleReady.push(`${chalk.gray(`[${new Date(time).toISOString()}]`)} ${chalk.blueBright(level.toUpperCase().padEnd(6, ' '))} ${chalk[colors[level]](logs.join(' '))}`);
      else
        consoleReady.push(`[${new Date(time).toISOString()}] ${level.toUpperCase().padEnd(6, ' ')} ${logs.join(' ')}`);

    }
    else {

      if ( colorful )
        consoleReady.push(chalk[colors[level]](...logs));
      else
        consoleReady = logs;

    }

    if ( level === 'error' ) this._originalConsoleError(...consoleReady);
    else (console[level] || console.log)(...consoleReady);

  }

}
