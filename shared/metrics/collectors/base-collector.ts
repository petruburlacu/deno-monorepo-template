export interface MetricCollector {
    recordDuration(name: string, durationMs: number): Promise<void>;
    recordSuccess(name: string): Promise<void>;
    recordFailure(name: string, error: string): Promise<void>;
    recordCount(name: string, value: number): Promise<void>;
}

export abstract class BaseMetricCollector implements MetricCollector {
    abstract recordDuration(name: string, durationMs: number): Promise<void>;
    abstract recordSuccess(name: string): Promise<void>;
    abstract recordFailure(name: string, error: string): Promise<void>;
    abstract recordCount(name: string, value: number): Promise<void>;
}
