import { Sightly } from '../common/types';
import request from 'request';
import config from '../config.json';
import LoggerClient from '../client/logger';
import validator from 'validator';

export default class LoggerAdmin extends LoggerClient {

  constructor(options: Sightly.LoggerOptionsExtended) {

    super(options);

  }

  /**
  * Sends the alert trigger request to the alerts server.
  * @param name The alert name.
  * @param data Optional data for the alert.
  */
  protected _triggerAlert(name: string, data?: any) {

    request.post(config.alertsServerUrl, {
      body: {
        name: name,
        data: data
      },
      auth: {
        bearer: this._token
      }
    }, (error, res) => {

      if ( error ) return console.error(error);
      if ( res.body.error ) return console.error(`SIGHTLY_ERROR: Could not trigger alert "${name}"!\n${res.body.message}`);

      console.debug(`Alert "${name}" was triggered`);

    });

  }

  /**
  * Returns true if string is either a special date string or a valid ISO date.
  * @param date The date string.
  */
  protected _isDateStringValid(date: string): boolean {

    if ( typeof date !== 'string' ) return false;

    // If special string
    if ( date.trim().toLowerCase().match(/^today|yesterday|\d+ days ago$/) ) return true;

    // If ISO date
    return validator.isISO8601(date);

  }

  /**
  * Returns true if input is a valid date object, number, or date string (including special strings).
  * @param date The supposed date.
  */
  protected _isDateValid(date: string|Date|number): boolean {

    if ( typeof date === 'number' ) return true;
    if ( date instanceof Date && ! isNaN(date.getTime()) ) return true;

    return this._isDateStringValid(<string>date);

  }

  /**
  * Downloads a log snapshot (archived logs will be excluded from all snapshots).
  * @param start The start time of the snapshot (can be an ISO time string, a timestamp, a Date object, or a special date string (LINK_TO_DOCS).
  * @param end The end time of the snapshot (can be an ISO time string, a timestamp, a Date object, or a special date string (LINK_TO_DOCS).
  *            Defaults to current time.
  */
  public snapshot(start: string|Date|number, end?: string|Date|number) {

    return new Promise((resolve, reject) => {

      // Validation
      if ( ! this._isDateValid(start) ) return reject(new Error('SIGHTLY_ERROR: Invalid start date!'));
      if ( end && ! this._isDateValid(end) ) return reject(new Error('SIGHTLY_ERROR: Invalid end date!'));

      request.get(config.logsServerHost + config.logsServerSnapshotPath, {
        qs: {
          start: start,
          end: end
        },
        auth: {
          bearer: this._token
        }
      }, (error, res) => {

        if ( error ) return reject(error);
        if ( res.body.error ) return reject(new Error(`SIGHTLY_ERROR: Could not get snapshot!\n${res.body.message}`));

        resolve(res.body);

      });

    });

  }

  /**
  * Archives all logs within the specified time range.
  * @param start The start time (can be an ISO time string, a timestamp, a Date object, or a special date string (LINK_TO_DOCS).
  * @param end The end time (can be an ISO time string, a timestamp, a Date object, or a special date string (LINK_TO_DOCS).
  */
  public archive(start: string|Date|number, end: string|Date|number) {

    return new Promise((resolve, reject) => {

      // Validation
      if ( ! this._isDateValid(start) ) return reject(new Error('SIGHTLY_ERROR: Invalid start date!'));
      if ( ! this._isDateValid(end) ) return reject(new Error('SIGHTLY_ERROR: Invalid end date!'));

      request.get(config.logsServerHost + config.logsServerArchivePath, {
        qs: {
          start: start,
          end: end
        },
        auth: {
          bearer: this._token
        }
      }, (error, res) => {

        if ( error ) return reject(error);
        if ( res.body.error ) return reject(new Error(`SIGHTLY_ERROR: Could not archive logs!\n${res.body.message}`));

        resolve(res.body);

      });

    });

  }

  /**
  * Triggers an alert.
  * @param name The alert name.
  * @param data Optional data for the alert.
  */
  public alert(name: string, data?: any): LoggerClient {

    if ( typeof name === 'string' && name.trim() ) this._triggerAlert(name.trim(), data);
    return this;

  }

  /**
  * Listens to logs on the current channel.
  * @param level The log level to listen to (debug, info, notice, warn, error, or all).
  * @param cb Callback.
  */
  public on(level: string, cb: (log: Sightly.LogObject) => unknown) {

    if ( ! ['debug', 'info', 'notice', 'warn', 'error', 'all'].includes(level) ) return;

    this._core.registerLogListener(cb, level, this._token);

  }

  /**
  * Removes a log listener on the current channel.
  * @param level The log level of the listener (debug, info, notice, warn, error, or all).
  * @param listener The listener to remove.
  */
  public off(level: string, cb: (log: Sightly.LogObject) => unknown) {

    if ( ! ['debug', 'info', 'notice', 'warn', 'error', 'all'].includes(level) ) return;

    this._core.unregisterLogListener(cb, level, this._token);

  }

}
