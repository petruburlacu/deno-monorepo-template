// deno-lint-ignore-file no-console
import { ensureFile } from 'https://deno.land/std/fs/ensure_file.ts';

/**
 * Enum representing different logging levels in order of severity.
 * @enum {string}
 */
export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
}

/**
 * Configuration interface for the Logger.
 * @interface
 */
export interface LogConfig {
    /** Minimum level of logs to process */
    level: LogLevel;
    /** Path to the log file */
    filePath?: string;
    /** Whether to include timestamps in logs */
    timestamp?: boolean;
    /** Whether to output logs to console */
    printToConsole?: boolean;
}

/**
 * Structure of a log entry.
 * @interface
 */
export interface LogEntry {
    /** Log level of the entry */
    level: LogLevel;
    /** Main log message */
    message: string;
    /** ISO timestamp of when the log was created */
    timestamp: string;
    /** Optional contextual information */
    context?: Record<string, unknown>;
    /** Optional error information */
    error?: {
        message: string;
        name: string;
        stack?: string; // Make stack optional since Error.stack can be undefined
    };
}

/**
 * A singleton logger class that handles structured logging with multiple output options.
 * @class
 * @example
 * const logger = Logger.getInstance({ level: LogLevel.DEBUG });
 * await logger.info('Application started', { version: '1.0.0' });
 */
export class Logger {
    private config: LogConfig;
    private static instance: Logger;

    /**
     * Creates a new Logger instance with the specified configuration.
     * @param {Partial<LogConfig>} config - Logger configuration options
     */
    constructor(config: Partial<LogConfig> = {}) {
        this.config = {
            level: LogLevel.INFO,
            filePath: './logs/app.log',
            timestamp: true,
            printToConsole: true,
            ...config,
        };
    }

    /**
     * Gets the singleton instance of the logger.
     * @param {Partial<LogConfig>} config - Optional configuration to initialize the logger
     * @returns {Logger} The singleton logger instance
     */
    static getInstance(config?: Partial<LogConfig>): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger(config);
        }
        return Logger.instance;
    }

    /**
     * Writes a log entry to the configured file.
     * @private
     * @param {LogEntry} entry - The log entry to write
     * @returns {Promise<void>}
     */
    private async writeToFile(entry: LogEntry): Promise<void> {
        if (!this.config.filePath) return;

        try {
            await ensureFile(this.config.filePath);
            const logLine = JSON.stringify(entry) + '\n';
            await Deno.writeTextFile(this.config.filePath, logLine, { append: true });
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    /**
     * Formats a log message into a structured log entry.
     * @private
     * @param {LogLevel} level - Log level
     * @param {string} message - Log message
     * @param {Record<string, unknown>} [context] - Optional context
     * @param {Error} [error] - Optional error object
     * @returns {LogEntry} Formatted log entry
     */
    private formatMessage(
        level: LogLevel,
        message: string,
        context?: Record<string, unknown>,
        error?: Error,
    ): LogEntry {
        return {
            level,
            message,
            timestamp: new Date().toISOString(),
            ...(context && { context }),
            ...(error && {
                error: {
                    message: error.message,
                    name: error.name,
                    ...(error.stack && { stack: error.stack }), // Only include stack if it exists
                },
            }),
        };
    }

    /**
     * Determines if a log level should be processed based on configured minimum level.
     * @private
     * @param {LogLevel} level - Level to check
     * @returns {boolean} Whether the level should be logged
     */
    private shouldLog(level: LogLevel): boolean {
        const levels = Object.values(LogLevel);
        return levels.indexOf(level) >= levels.indexOf(this.config.level);
    }

    /**
     * Core logging function that handles all log processing.
     * @private
     * @param {LogLevel} level - Log level
     * @param {string} message - Log message
     * @param {Record<string, unknown>} [context] - Optional context
     * @param {Error} [error] - Optional error object
     * @returns {Promise<void>}
     */
    private async log(
        level: LogLevel,
        message: string,
        context?: Record<string, unknown>,
        error?: Error,
    ): Promise<void> {
        if (!this.shouldLog(level)) return;

        const entry = this.formatMessage(level, message, context, error);

        if (this.config.printToConsole) {
            const consoleMethod = level === LogLevel.ERROR ? 'error' : level === LogLevel.WARN ? 'warn' : level === LogLevel.DEBUG ? 'debug' : 'log';

            console[consoleMethod](
                `[${entry.timestamp}] ${level}: ${message}`,
                context ? '\nContext:' : '',
                context ?? '',
                error ? '\nError:' : '',
                error ?? '',
            );
        }

        await this.writeToFile(entry);
    }

    /**
     * Logs a debug message.
     * @param {string} message - Debug message
     * @param {Record<string, unknown>} [context] - Optional context
     * @returns {Promise<void>}
     */
    async debug(message: string, context?: Record<string, unknown>): Promise<void> {
        await this.log(LogLevel.DEBUG, message, context);
    }

    /**
     * Logs an info message.
     * @param {string} message - Info message
     * @param {Record<string, unknown>} [context] - Optional context
     * @returns {Promise<void>}
     */
    async info(message: string, context?: Record<string, unknown>): Promise<void> {
        await this.log(LogLevel.INFO, message, context);
    }

    /**
     * Logs a warning message.
     * @param {string} message - Warning message
     * @param {Record<string, unknown>} [context] - Optional context
     * @returns {Promise<void>}
     */
    async warn(message: string, context?: Record<string, unknown>): Promise<void> {
        await this.log(LogLevel.WARN, message, context);
    }

    /**
     * Logs an error message.
     * @param {string} message - Error message
     * @param {Error} [error] - Optional error object
     * @param {Record<string, unknown>} [context] - Optional context
     * @returns {Promise<void>}
     */
    async error(message: string, error?: Error, context?: Record<string, unknown>): Promise<void> {
        await this.log(LogLevel.ERROR, message, context, error);
    }

    /**
     * Sets the minimum log level.
     * @param {LogLevel} level - New minimum log level
     */
    setLevel(level: LogLevel): void {
        this.config.level = level;
    }

    /**
     * Clears all logs from the log file.
     * @returns {Promise<void>}
     */
    async clearLogs(): Promise<void> {
        if (this.config.filePath) {
            try {
                await Deno.writeTextFile(this.config.filePath, '');
            } catch (error) {
                console.error('Failed to clear logs:', error);
            }
        }
    }
}
