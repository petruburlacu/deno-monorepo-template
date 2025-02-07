export interface MetricConfig {
    name: string;
    help: string;
    labels?: string[];
}

export interface Labels {
    [key: string]: string;
}

export abstract class Metric {
    protected readonly name: string;
    protected readonly help: string;
    protected readonly labelNames: string[];

    constructor(config: MetricConfig) {
        this.name = config.name;
        this.help = config.help;
        this.labelNames = config.labels ?? [];
    }

    protected validateLabels(labels: Labels): void {
        const providedLabels = Object.keys(labels);
        const missingLabels = this.labelNames.filter((name) => !providedLabels.includes(name));
        const extraLabels = providedLabels.filter((name) => !this.labelNames.includes(name));

        if (missingLabels.length > 0) {
            throw new Error(`Missing required labels: ${missingLabels.join(', ')}`);
        }
        if (extraLabels.length > 0) {
            throw new Error(`Unexpected labels provided: ${extraLabels.join(', ')}`);
        }
    }
}
