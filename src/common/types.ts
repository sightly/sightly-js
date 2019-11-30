import LogsQueue from './queue';

export namespace Sightly {

  export interface LoggerOptions {

    /** The log channel (defaults to 'default'). */
    channel?: string;
    /** The maximum number of logs to queue when connection to server is lost (defaults to Infinity). */
    queueSize?: number;
    /** Whether to capture errors logged by console.error or not (defaults to false). */
    captureErrors?: boolean;
    /** Whether to log to console or not (defaults to true). */
    consoleLogs?: boolean;
    /** Determines if logs should be logged to console with color (defaults to true). */
    colorfulConsoleLogs?: boolean;
    /** Determines if console logs should be structured and contain metadata (defaults to true). */
    structuredConsoleLogs?: boolean;

  }

  export interface LoggerOptionsExtended extends LoggerOptions {

    queue?: LogsQueue;
    tags: string[];
    token: string;

  }

  export type Log = string|number|boolean|Date|Object|Array<Log>;

  export interface LogObject {

    time: number;
    level: 'debug'|'info'|'notice'|'warn'|'error';
    tags?: string[];
    messages: Log[];

  }

  export interface InternalLogObject extends LogObject {

    channel: string;

  }

  export type EventHandler = (data: Event) => void;

  export interface Event {

    data: any;

  }

  export interface SocketRegistry {

    [token: string]: SocketIOClient.Socket;

  }

  export interface LogListeners {

    [token: string]: {
      debug: Function[];
      info: Function[];
      notice: Function[];
      warn: Function[];
      error: Function[];
      all: Function[];
    };

  }

  export interface QueueRegistry {

    [token: string]: LogsQueue[];

  }

  export interface QueueListeners {

    [event: string]: Function[];

  }

}
