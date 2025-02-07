import { ensureFile } from 'https://deno.land/std/fs/ensure_file.ts';

/**
 * Interface representing a single metric entry.
 * @interface
 */
export interface Metric {
    /** Name of the step or operation being measured */
    step: string;
    /** Duration of the operation in milliseconds */
    duration: number;
    /** Status of the operation */
    status: 'success' | 'failure';
    /** Optional timestamp of when the metric was recorded */
    timestamp?: number;
    /** Optional error message if status is failure */
    error?: string;
    /** Optional additional contextual information */
    additionalInfo?: Record<string, unknown>;
}

/**
 * A class that handles writing performance and operational metrics to a file.
 * Supports batch writing for better performance and provides reading capabilities
 * for analysis.
 * @class
 * @example
 * const metrics = new MetricsWriter('./metrics/api.jsonl');
 * await metrics.write({
 *   step: 'fetchData',
 *   duration: 150,
 *   status: 'success'
 * });
 */
export class MetricsWriter {
    private readonly filePath: string;
    private readonly batchSize: number;
    private metricsQueue: Metric[] = [];

    /**
     * Creates a new MetricsWriter instance.
     * @param {string} filePath - Path where metrics will be written
     * @param {number} batchSize - Number of metrics to batch before writing
     */
    constructor(filePath = './metrics.jsonl', batchSize = 100) {
        this.filePath = filePath;
        this.batchSize = batchSize;
    }

    /**
     * Writes a single metric to the queue and flushes if batch size is reached.
     * @param {Metric} metric - The metric to write
     * @throws {Error} When writing fails
     * @returns {Promise<void>}
     * @example
     * await metricsWriter.write({
     *   step: 'processData',
     *   duration: 100,
     *   status: 'success',
     *   additionalInfo: { recordsProcessed: 50 }
     * });
     */
    async write(metric: Metric): Promise<void> {
        try {
            const enrichedMetric = {
                ...metric,
                timestamp: metric.timestamp ?? Date.now(),
            };

            this.metricsQueue.push(enrichedMetric);

            if (this.metricsQueue.length >= this.batchSize) {
                await this.flush();
            }
        } catch (error) {
            // deno-lint-ignore no-console
            console.error('Failed to write metric:', error);
            throw new Error(`Metrics writing failed: ${error}`);
        }
    }

    /**
     * Flushes all queued metrics to the file.
     * @throws {Error} When flush operation fails
     * @returns {Promise<void>}
     */
    async flush(): Promise<void> {
        if (this.metricsQueue.length === 0) {
            return;
        }

        try {
            await ensureFile(this.filePath);

            const metricsToWrite = this.metricsQueue.map((metric) => JSON.stringify(metric)).join('\n') + '\n';

            await Deno.writeTextFile(
                this.filePath,
                metricsToWrite,
                { append: true },
            );

            this.metricsQueue = [];
        } catch (error) {
            // deno-lint-ignore no-console
            console.error('Failed to flush metrics:', error);
            throw new Error(`Metrics flush failed: ${error}`);
        }
    }

    /**
     * Reads all metrics from the file.
     * @returns {Promise<Metric[]>} Array of metrics
     * @throws {Error} When reading fails
     * @example
     * const allMetrics = await metricsWriter.readMetrics();
     * const avgDuration = allMetrics.reduce((acc, m) => acc + m.duration, 0) / allMetrics.length;
     */
    async readMetrics(): Promise<Metric[]> {
        try {
            const content = await Deno.readTextFile(this.filePath);
            return content
                .split('\n')
                .filter(Boolean)
                .map((line) => JSON.parse(line));
        } catch (error) {
            if (error instanceof Deno.errors.NotFound) {
                return [];
            }
            // deno-lint-ignore no-console
            console.error('Failed to read metrics:', error);
            throw new Error(`Read metrics failed: ${error}`);
        }
    }
}
