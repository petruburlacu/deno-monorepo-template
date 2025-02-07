import type { StepContext } from '@shared/steps';

export interface JobContext extends StepContext {
    sourceId: string;
    targetId: string;
    serviceUrl: string;
}
