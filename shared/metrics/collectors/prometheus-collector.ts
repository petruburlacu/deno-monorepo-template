import { BaseMetricCollector } from './base-collector.ts';

export class PrometheusCollector extends BaseMetricCollector {
    private metrics: Map<string, number> = new Map();

    recordDuration(name: string, durationMs: number): Promise<void> {
        this.metrics.set(`${name}_duration_ms`, durationMs);
        return Promise.resolve();
    }

    recordSuccess(name: string): Promise<void> {
        const key = `${name}_success_total`;
        this.metrics.set(key, (this.metrics.get(key) ?? 0) + 1);
        return Promise.resolve();
    }

    recordFailure(name: string, _error: string): Promise<void> {
        const key = `${name}_failure_total`;
        this.metrics.set(key, (this.metrics.get(key) ?? 0) + 1);
        return Promise.resolve();
    }

    recordCount(name: string, value: number): Promise<void> {
        this.metrics.set(name, value);
        return Promise.resolve();
    }

    getMetrics(): string {
        return Array.from(this.metrics.entries())
            .map(([key, value]) => `${key} ${value}`)
            .join('\n');
    }
}
