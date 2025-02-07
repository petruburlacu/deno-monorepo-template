import { Logger } from '@shared/logging';
import type { Step, StepContext, StepResult } from '@shared/steps';

export interface RetryConfig {
    maxAttempts: number;
    backoffMs: number;
}

export function withRetry<I, O>(config: RetryConfig) {
    // deno-lint-ignore no-explicit-any
    return function <T extends new (...args: any[]) => Step<I, O>>(target: T) {
        const logger = Logger.getInstance();

        return class extends target {
            override async execute(input: I, context: StepContext): Promise<StepResult<O>> {
                let lastError: Error | undefined;

                for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
                    try {
                        return await super.execute(input, {
                            ...context,
                            retryCount: attempt - 1,
                        });
                    } catch (error) {
                        lastError = error as Error;
                        const isLastAttempt = attempt === config.maxAttempts;

                        logger.warn(`Attempt ${attempt}/${config.maxAttempts} failed`, {
                            error: lastError.name,
                            step: target.name,
                            jobId: context.jobId,
                            isLastAttempt,
                        });

                        if (!isLastAttempt) {
                            const delay = config.backoffMs * Math.pow(2, attempt - 1);
                            await new Promise((resolve) => setTimeout(resolve, delay));
                            continue;
                        }
                        throw error;
                    }
                }

                throw lastError;
            }
        } as T;
    };
}
