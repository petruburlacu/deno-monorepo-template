export interface RequestConfig {
    method?: string;
    headers?: Record<string, string>;
    body?: string | null;
    params?: Record<string, string>;
    url?: string;
    timeout?: number;
    startTime?: number;
    signal?: AbortSignal;
    cache?: {
        ttl: number;
        key?: string;
    };
}
