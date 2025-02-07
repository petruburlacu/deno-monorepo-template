import { type Step, type StepContext, type StepResult, withMetrics, withRetry } from '@shared/steps';
import type { FetchDataInput, FetchDataOutput } from './types.ts';
import { UserService } from '../../services/user.service.ts';

@withMetrics({ name: 'FetchDataStep' })
@withRetry({ maxAttempts: 3, backoffMs: 1000 })
export class FetchDataStep implements Step<FetchDataInput, FetchDataOutput> {
    constructor(private readonly userService = new UserService()) {}

    /**
     * Fetches data from the core client
     * @param input - The input for the step
     * @param _context - The context for the step
     *      {
     *          jobId: string;
     *          dryRun: boolean;
     *          sourceId: string;
     *          targetId: string;
     *          serviceUrl: string;
     *          timestamp: number;
     *          retryCount: number;
     *      }
     * @returns The output of the step
     */
    async execute(input: FetchDataInput, _context: StepContext): Promise<StepResult<FetchDataOutput>> {
        const startTime = Date.now();
        const data = await this.userService.getData(input.id);
        return {
            data: {
                records: data,
                totalRecords: data.length,
                lastProcessedAt: Date.now(),
            },
            metadata: {
                status: 'success',
                startTime,
                endTime: Date.now(),
            },
        };
    }
}
