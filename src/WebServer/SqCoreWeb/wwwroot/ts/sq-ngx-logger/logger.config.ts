import {NgxLoggerLevel} from './types/logger-level.enum';

export class LoggerConfig {
  level?: NgxLoggerLevel;    // without ?, LINT error: "Property 'name' has no initializer and is not definitely assigned in the constructor.""
  serverLogLevel?: NgxLoggerLevel;
  serverLoggingUrl?: string;
  disableConsoleLogging?: boolean;
  httpResponseType?: 'arraybuffer' | 'blob' | 'text' | 'json';
  enableSourceMaps?: boolean;
  /** Timestamp format. Defaults to ISOString */
  timestampFormat?: 'short' | 'medium' | 'long' | 'full' | 'shortDate' |
    'mediumDate' | 'longDate' | 'fullDate' | 'shortTime' | 'mediumTime' |
    'longTime' | 'fullTime' ;
}
