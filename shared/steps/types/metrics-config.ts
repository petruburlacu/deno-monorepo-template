import type { MetricsCollector } from '@shared/metrics';

export interface MetricsConfig {
    name: string;
    collector?: MetricsCollector;
}
