import { type Labels, Metric, type MetricConfig } from './base.ts';

interface HistogramConfig extends MetricConfig {
    buckets: number[];
}

export class Histogram extends Metric {
    private readonly buckets: number[];
    private readonly values = new Map<string, { sum: number; count: number; buckets: Map<number, number> }>();

    constructor(config: HistogramConfig) {
        super(config);
        this.buckets = [...config.buckets].sort((a, b) => a - b);
    }

    observe(labels: Labels = {}, value: number): void {
        this.validateLabels(labels);
        const key = this.getKey(labels);

        let metrics = this.values.get(key);
        if (!metrics) {
            metrics = {
                sum: 0,
                count: 0,
                buckets: new Map(this.buckets.map((bucket) => [bucket, 0])),
            };
            this.values.set(key, metrics);
        }

        metrics.sum += value;
        metrics.count++;

        for (const bucket of this.buckets) {
            if (value <= bucket) {
                metrics.buckets.set(bucket, (metrics.buckets.get(bucket) ?? 0) + 1);
            }
        }
    }

    get(labels: Labels = {}): { sum: number; count: number; buckets: Map<number, number> } {
        this.validateLabels(labels);
        const key = this.getKey(labels);
        return this.values.get(key) ?? { sum: 0, count: 0, buckets: new Map() };
    }

    private getKey(labels: Labels): string {
        return this.labelNames
            .map((name) => `${name}="${labels[name] ?? ''}"`)
            .join(',');
    }
}
