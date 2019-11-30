import { Sightly } from './types';

export default class LogsQueue {

  private _queue: Sightly.InternalLogObject[] = [];
  private _listeners: Sightly.QueueListeners = {
    empty: [],
    push: [],
    pull: []
  };

  constructor(private maxSize: number = Infinity) { }

  /**
  * Adds logs to the end of the queue.
  * @param logs Logs to add to the queue.
  */
  public push(...logs: Sightly.InternalLogObject[]) {

    for ( const log of logs ) {

      if ( this._queue.length === this.maxSize ) break;

      this._queue.push(log);

      // Call all listeners
      for ( const listener of this._listeners.push ) listener(log);

    }

  }

  /**
  * Removes and returns the first log in the queue (or null if nothing left).
  */
  public pull(): Sightly.InternalLogObject {

    if ( ! this._queue.length ) return null;

    const log = this._queue.shift();

    // Call all listeners
    for ( const listener of this._listeners.pull ) listener(log);

    if ( this.empty ) {

      // Call all listeners
      for ( const listener of this._listeners.empty ) listener();

    }

    return log;

  }

  /**
  * Returns a boolean determining if the queue is empty.
  */
  public get empty(): boolean {

    return ! this._queue.length;

  }

  /**
  * Returns the queue length.
  */
  public get length(): number {

    return this._queue.length;

  }

  /**
  * Returns the maximum size of the queue.
  */
  public get max(): number {

    return this.maxSize;

  }

  /**
  * Listens to an event on this queue.
  * @param event The event name (either empty, push, or pull).
  * @param cb The callback.
  */
  public on(event: string, cb: Function) {

    if ( this._listeners[event] ) this._listeners[event].push(cb);

  }

  /**
  * Removes a listener to an event on this queue.
  * @param event The event name (either empty, push, or pull).
  * @param cb The callback.
  */
  public off(event: string, cb: Function) {

    // If event doesn't exist
    if ( ! this._listeners[event] ) return;

    const index = this._listeners[event].indexOf(cb);

    // Remove the listener if found
    if ( index !== -1 ) this._listeners[event].splice(index, 1);

  }

}
