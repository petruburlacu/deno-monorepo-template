export interface FetchDataInput {
    id: string;
    params?: Record<string, string>;
    timeout?: number;
}

export interface FetchDataOutput {
    records: Record<string, unknown>[];
    totalRecords: number;
    lastProcessedAt: number;
}
