export interface StepContext {
    jobId: string;
    timestamp: number;
    dryRun: boolean;
    retryCount?: number;
}

export interface StepResult<T> {
    data: T;
    metadata: {
        status: 'success' | 'error';
        startTime: number;
        endTime: number;
        error?: Error;
    };
}

export interface Step<TInput, TOutput> {
    execute(input: TInput, context: StepContext): Promise<StepResult<TOutput>>;
}
