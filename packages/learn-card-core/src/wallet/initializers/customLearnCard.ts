import { generateLearnCard } from '@wallet/base';
import { CustomLearnCard } from 'types/LearnCard';

/**
 * Generates a custom LearnCard with no plugins added
 *
 * @group Init Functions
 */
export const customLearnCard = async ({ debug }: Partial<CustomLearnCard['args']> = {}): Promise<
    CustomLearnCard['returnValue']
> => generateLearnCard({ debug });
