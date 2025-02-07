export interface HttpMetrics {
    method: string;
    path: string;
    status: number;
    duration: number;
    labels?: Record<string, string>;
}
