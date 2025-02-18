import { Logger } from '@shared/logging';
import { FetchDataStep } from '../steps/fetch-data/mod.ts';
import type { JobContext } from '../steps/types.ts';
import { createAuthMiddleware } from '@shared/http';

export class DataPrepJob {
    private readonly logger = Logger.getInstance();
    private readonly fetchDataStep = new FetchDataStep();

    async execute(context: JobContext): Promise<void> {
        this.logger.info('Starting data preparation job', {
            jobId: context.jobId,
            sourceId: context.sourceId,
            targetId: context.targetId,
        });

        // Source data pipeline
        const sourceData = await this.fetchDataStep.execute(
            { id: context.sourceId },
            context,
        );

        const authMiddleware = createAuthMiddleware({
            apiKey: context.apiKey,
        });

        this.logger.info('Data preparation completed', {
            jobId: context.jobId,
            recordsProcessed: sourceData.data.totalRecords,
        });
    }
}
