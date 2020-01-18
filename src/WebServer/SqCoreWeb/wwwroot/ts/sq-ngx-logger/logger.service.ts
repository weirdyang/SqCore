import { NgxLoggerLevel } from './types/logger-level.enum.js';
import { LoggerConfig } from './logger.config.js';
import { NGXLoggerConfigEngine } from './config.engine.js';
import { NGXLoggerUtils } from './utils/logger.utils.js';
import { NGXLogInterface } from './types/ngx-log.interface.js';

export const Levels = [
  'TRACE',
  'DEBUG',
  'INFO',
  'LOG',
  'WARN',
  'ERROR',
  'FATAL',
  'OFF'
];

// Usage:
// logger settings should be: in early Development stages (when many errors are expected), it should log Trace to console, but not bother the server
// const loggerDevEarly: NGXLogger = new NGXLogger({ level: NgxLoggerLevel.TRACE});
// logger settings should be: in further Development stages (when no errors are expected, we might want to find a bug), it should log Info console and Error to server
// const loggerDevMature: NGXLogger = new NGXLogger({ level: NgxLoggerLevel.INFO, serverLogLevel: NgxLoggerLevel.ERROR, serverLoggingUrl: '/JsLog'});
// logger settings should be: In Production: only log Error or Fatal to server and console.
// const loggerProd: NGXLogger = new NGXLogger({ level: NgxLoggerLevel.ERROR, serverLogLevel: NgxLoggerLevel.ERROR, serverLoggingUrl: '/JsLog'});
export class NGXLogger {
  private readonly _logFunc: Function;
  private config: NGXLoggerConfigEngine;


  constructor(loggerConfig: LoggerConfig) {
    this.config = new NGXLoggerConfigEngine(loggerConfig);
    this._logFunc = this._logModern.bind(this);
  }

  public trace(message, ...additional: any[]): void {
    this._log(NgxLoggerLevel.TRACE, message, additional);
  }

  public debug(message, ...additional: any[]): void {
    this._log(NgxLoggerLevel.DEBUG, message, additional);
  }

  public info(message, ...additional: any[]): void {
    this._log(NgxLoggerLevel.INFO, message, additional);
  }

  public log(message, ...additional: any[]): void {
    this._log(NgxLoggerLevel.LOG, message, additional);
  }

  public warn(message, ...additional: any[]): void {
    this._log(NgxLoggerLevel.WARN, message, additional);
  }

  public error(message, ...additional: any[]): void {
    this._log(NgxLoggerLevel.ERROR, message, additional);
  }

  public fatal(message, ...additional: any[]): void {
    this._log(NgxLoggerLevel.FATAL, message, additional);
  }

  private _logModern(level: NgxLoggerLevel, metaString: string, message: string, additional: any[]): void {

    const color = NGXLoggerUtils.getColor(level);

    // make sure additional isn't null or undefined so that ...additional doesn't error
    additional = additional || [];

    switch (level) {
      case NgxLoggerLevel.WARN:
        console.warn(`%c${metaString}`, `color:${color}`, message, ...additional);
        break;
      case NgxLoggerLevel.ERROR:
      case NgxLoggerLevel.FATAL:
        console.error(`%c${metaString}`, `color:${color}`, message, ...additional);
        break;
      case NgxLoggerLevel.INFO:
        console.info(`%c${metaString}`, `color:${color}`, message, ...additional);
        break;
      //  Disabling console.trace since the stack trace is not helpful. it is showing the stack trace of
      // the console.trace statement
      // case NgxLoggerLevel.TRACE:
      //   console.trace(`%c${metaString}`, `color:${color}`, message, ...additional);
      //   break;

      //  Disabling console.debug, because Has this hidden by default.
      // case NgxLoggerLevel.DEBUG:
      //   console.debug(`%c${metaString}`, `color:${color}`, message, ...additional);
      //   break;
      default:
        console.log(`%c${metaString}`, `color:${color}`, message, ...additional);
    }
  }

  private _log(level: NgxLoggerLevel, message, additional: any[] = [], logOnServer: boolean = true): void {

    //let levelStr = NgxLoggerLevel[level];  // level is a number, lixe 6. We convert it into string.
    //console.log('NgxLog: level:'+ levelStr + ',message:' + message);

    const config = this.config.getConfig();
    const isLog2Server = logOnServer && config.serverLoggingUrl && config.serverLoggingUrl != '' && config.serverLogLevel && level >= config.serverLogLevel;
    const isLogLevelEnabled = level >= config.level;

    if (!(message && (isLog2Server || isLogLevelEnabled))) {
      return;
    }

    const logLevelString = Levels[level];

    message = typeof message === 'function' ? message() : message;
    message = NGXLoggerUtils.prepareMessage(message);

    // only use validated parameters for HTTP requests
    const validatedAdditionalParameters = NGXLoggerUtils.prepareAdditionalParameters(additional);

    const timestamp = new Date().toISOString();
    // config.timestampFormat ?  this.datePipe.transform(new Date(), config.timestampFormat) :

    const callerDetails = NGXLoggerUtils.getCallerDetails();

    // mapperService() downloads *.map file and finds the code in TS file instead of JS files. That is good, but we don't complicate and slows down the execution now, and there is a React Observable dependency too.
    // this.mapperService.getCallerDetails(config.enableSourceMaps).subscribe((callerDetails: LogPosition) => {
    const logObject: NGXLogInterface = {
      message: message,
      additional: validatedAdditionalParameters,
      level: level,
      timestamp: timestamp,
      fileName: callerDetails.fileName,
      lineNumber: callerDetails.lineNumber.toString()
    };

    if (isLog2Server) {
      // make sure the stack gets sent to the server
      message = message instanceof Error ? message.stack : message;
      logObject.message = message;

      fetch('/JsLog', {
        method: 'POST', // or 'PUT'
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logObject),
      })
      .then((data) => { // will return return NoContent(); for saving bandwith, although it can return OK if we want.
        // console.log('NgxLog: Post to server: Success');
        // console.log('JsLog Success:', data);
      })
      .catch((error) => {
        console.error('NgxLog: Error: Post to server: FAILED.', error);
      });
    }

    // if no message or the log level is less than the environ
    if (isLogLevelEnabled && !config.disableConsoleLogging) {
      const metaString = NGXLoggerUtils.prepareMetaString(timestamp, logLevelString,
        callerDetails.fileName, callerDetails.lineNumber.toString());

      return this._logFunc(level, metaString, message, additional);
    }

  }
}
