import type { RequestConfig } from '@shared/http';

export interface HttpError extends Error {
    status?: number;
    code?: string;
    data?: unknown;
    config?: RequestConfig;
    url?: string;
}
