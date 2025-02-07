export interface StepConfig {
    name: string;
    metrics?: {
        name: string;
    };
    retry?: {
        maxAttempts: number;
        backoffMs: number;
        exponential: boolean;
    };
}
