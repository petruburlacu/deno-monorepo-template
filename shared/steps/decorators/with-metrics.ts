import { Logger } from '@shared/logging';
import { MetricsCollector } from '@shared/metrics';
import type { Step, StepContext, StepResult } from '../types/step.ts';
import type { MetricsConfig } from '@shared/steps';

export function withMetrics<I, O>(config: MetricsConfig) {
    // deno-lint-ignore no-explicit-any
    return function <T extends new (...args: any[]) => Step<I, O>>(target: T) {
        return class extends target {
            override async execute(input: I, context: StepContext): Promise<StepResult<O>> {
                const metrics = config.collector ?? MetricsCollector.getInstance();
                const logger = Logger.getInstance();
                const startTime = Date.now();
                const trackRequest = metrics.trackActiveRequest(config.name);

                logger.debug(`Starting step execution`, {
                    step: config.name,
                    jobId: context.jobId,
                });

                try {
                    const result = await super.execute(input, context);
                    const duration = Date.now() - startTime;

                    metrics.recordHttpRequest({
                        method: 'STEP',
                        path: config.name,
                        status: result.metadata.status === 'success' ? 200 : 500,
                        duration,
                    });

                    return result;
                } catch (error) {
                    const duration = Date.now() - startTime;
                    metrics.recordHttpError({
                        method: 'STEP',
                        path: config.name,
                        errorType: error instanceof Error ? error.name : 'unknown',
                        status: 500,
                        duration,
                        labels: { // method, path, errorType
                            method: 'STEP',
                            path: config.name,
                            errorType: error instanceof Error ? error.name : 'unknown',
                        },
                    });
                    throw error;
                } finally {
                    trackRequest();
                }
            }
        } as T;
    };
}
