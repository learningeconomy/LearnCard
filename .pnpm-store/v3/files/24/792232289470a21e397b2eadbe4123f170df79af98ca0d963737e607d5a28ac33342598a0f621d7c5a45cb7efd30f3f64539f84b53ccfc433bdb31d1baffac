/**
 * Configuration interface for prometheus exporter
 */
export interface ExporterConfig {
    /**
     * App prefix for metrics, if needed
     *
     * @default ''
     * */
    prefix?: string;
    /**
     * Append timestamp to metrics
     * @default true
     */
    appendTimestamp?: boolean;
    /**
     * Endpoint the metrics should be exposed at with preceding slash
     * @default '/metrics'
     */
    endpoint?: string;
    /**
     * @default undefined (all interfaces)
     */
    host?: string;
    /**
     * Port number for Prometheus exporter server
     *
     * Default registered port is 9464:
     * https://github.com/prometheus/prometheus/wiki/Default-port-allocations
     * @default 9464
     */
    port?: number;
    /**
     * Prevent the Prometheus exporter server from starting
     * @default false
     */
    preventServerStart?: boolean;
}
//# sourceMappingURL=types.d.ts.map