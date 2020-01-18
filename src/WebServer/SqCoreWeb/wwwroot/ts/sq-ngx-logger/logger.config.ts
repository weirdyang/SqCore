import {NgxLoggerLevel} from './types/logger-level.enum.js';

export class LoggerConfig {
  level: NgxLoggerLevel = NgxLoggerLevel.OFF;    // without ?, LINT error: "Property 'name' has no initializer and is not definitely assigned in the constructor.""
  serverLogLevel?: NgxLoggerLevel = NgxLoggerLevel.OFF;
  serverLoggingUrl?: string = '';
  disableConsoleLogging?: boolean = false; // disables console logging, while still alerting the log monitor and alerting server
  httpResponseType?: 'arraybuffer' | 'blob' | 'text' | 'json';
  enableSourceMaps?: boolean;
  /** Timestamp format. Defaults to ISOString */
  timestampFormat?: 'short' | 'medium' | 'long' | 'full' | 'shortDate' |
    'mediumDate' | 'longDate' | 'fullDate' | 'shortTime' | 'mediumTime' |
    'longTime' | 'fullTime' ;
}
