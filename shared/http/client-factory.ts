import { CoreClient } from '@shared/http';
import { Logger } from '@shared/logging';
import { MetricsCollector } from '@shared/metrics';
import { getApiConfig } from '@shared/config';

export class ClientFactory {
    private static instances = new Map<string, unknown>();

    static getCoreClient(): CoreClient {
        return this.getInstance('core', () => new CoreClient(getApiConfig(), Logger.getInstance(), MetricsCollector.getInstance()));
    }

    // Add the other clients here

    private static getInstance<T>(key: string, factory: () => T): T {
        if (!this.instances.has(key)) {
            this.instances.set(key, factory());
        }
        return this.instances.get(key) as T;
    }
}
