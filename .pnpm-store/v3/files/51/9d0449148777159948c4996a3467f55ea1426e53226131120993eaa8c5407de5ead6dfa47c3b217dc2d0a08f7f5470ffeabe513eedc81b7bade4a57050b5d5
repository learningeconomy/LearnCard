import { Aggregation } from './Aggregation';
import { AttributesProcessor } from './AttributesProcessor';
export interface ViewStreamConfig {
    /**
     * the name of the resulting metric to generate, or null if the same as the instrument.
     */
    name?: string;
    /**
     * the name of the resulting metric to generate, or null if the same as the instrument.
     */
    description?: string;
    /**
     * the aggregation used for this view.
     */
    aggregation?: Aggregation;
    /**
     * processor of attributes before performing aggregation.
     */
    attributesProcessor?: AttributesProcessor;
}
/**
 * A View provides the flexibility to customize the metrics that are output by
 * the SDK. For example, the view can
 * - customize which Instruments are to be processed/ignored.
 * - customize the aggregation.
 * - customize which attribute(s) are to be reported as metrics dimension(s).
 * - add additional dimension(s) from the {@link Context}.
 */
export declare class View {
    readonly name?: string;
    readonly description?: string;
    readonly aggregation: Aggregation;
    readonly attributesProcessor: AttributesProcessor;
    /**
     * Construct a metric view
     *
     * @param config how the result metric streams were configured
     */
    constructor(config?: ViewStreamConfig);
}
//# sourceMappingURL=View.d.ts.map