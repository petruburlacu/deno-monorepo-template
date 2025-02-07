import { type Labels, Metric, type MetricConfig } from './base.ts';

export class Gauge extends Metric {
    private values = new Map<string, number>();

    constructor(config: MetricConfig) {
        super(config);
    }

    inc(labels: Labels = {}, value = 1): void {
        this.validateLabels(labels);
        const key = this.getKey(labels);
        const currentValue = this.values.get(key) ?? 0;
        this.values.set(key, currentValue + value);
    }

    dec(labels: Labels = {}, value = 1): void {
        this.inc(labels, -value);
    }

    set(labels: Labels = {}, value: number): void {
        this.validateLabels(labels);
        const key = this.getKey(labels);
        this.values.set(key, value);
    }

    get(labels: Labels = {}): number {
        this.validateLabels(labels);
        const key = this.getKey(labels);
        return this.values.get(key) ?? 0;
    }

    private getKey(labels: Labels): string {
        return this.labelNames
            .map((name) => `${name}="${labels[name] ?? ''}"`)
            .join(',');
    }
}
