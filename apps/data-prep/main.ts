import { Logger } from '@shared/logging';
import { DataPrepJob } from './jobs/data-prep.job.ts';
import type { JobContext } from './steps/types.ts';

if (import.meta.main) {
    const logger = Logger.getInstance();
    const context: JobContext = {
        jobId: crypto.randomUUID(),
        dryRun: Deno.env.get('DRY_RUN') === 'true',
        sourceId: Deno.env.get('SOURCE_ID') ?? 'source-1',
        targetId: Deno.env.get('TARGET_ID') ?? 'target-1',
        serviceUrl: Deno.env.get('SERVICE_URL') ?? 'https://api.service-1.com/data',
        timestamp: Date.now(),
    };

    try {
        const job = new DataPrepJob();
        await job.execute(context);
    } catch (_error: unknown) {
        logger.error('Data preparation failed');
        Deno.exit(1);
    }
}
