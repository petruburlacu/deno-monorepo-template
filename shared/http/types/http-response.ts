import { RequestConfig } from '@shared/http';

export interface HttpResponse<T> {
    data: T;
    status: number;
    headers: Headers;
    config: RequestConfig;
    url: string;
}
