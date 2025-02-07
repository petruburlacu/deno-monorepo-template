import { BaseMetricCollector } from './base-collector.ts';

export class PrometheusCollector extends BaseMetricCollector {
    private metrics: Map<string, number> = new Map();

    async recordDuration(name: string, durationMs: number): Promise<void> {
        this.metrics.set(`${name}_duration_ms`, durationMs);
    }

    async recordSuccess(name: string): Promise<void> {
        const key = `${name}_success_total`;
        this.metrics.set(key, (this.metrics.get(key) ?? 0) + 1);
    }

    async recordFailure(name: string, error: string): Promise<void> {
        const key = `${name}_failure_total`;
        this.metrics.set(key, (this.metrics.get(key) ?? 0) + 1);
    }

    async recordCount(name: string, value: number): Promise<void> {
        this.metrics.set(name, value);
    }

    getMetrics(): string {
        return Array.from(this.metrics.entries())
            .map(([key, value]) => `${key} ${value}`)
            .join('\n');
    }
}
