import { HttpClient } from '../http-client.ts';
import { createAuthMiddleware } from '../middlewares/auth.middleware.ts';
import { createLoggingMiddleware } from '../middlewares/logging.middleware.ts';
import { createMetricsMiddleware } from '../middlewares/metrics.middleware.ts';
import type { MetricsCollector } from '../../metrics/collector.ts';
import type { Logger } from '@shared/logging';
import type { ApiConfig } from '@shared/config';

export class CoreClient {
    private readonly http: HttpClient;

    constructor(
        private readonly config: ApiConfig,
        private readonly logger: Logger,
        private readonly metrics: MetricsCollector,
    ) {
        this.http = new HttpClient({
            baseUrl: config.baseUrl,
            middlewares: [
                createLoggingMiddleware(this.logger),
                createMetricsMiddleware(this.metrics),
                createAuthMiddleware(() => config.apiKey), // auth token
            ],
        });
    }

    public getHttpClient(): HttpClient {
        return this.http;
    }
}
