export interface RequestMetrics {
    method: string;
    path: string;
    status: number;
    duration: number;
    error?: string;
}
