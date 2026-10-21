import { connect } from 'node:net';
import { z } from 'zod';
import type { Deployment } from './compose-driver';
import type { Observation, Runner } from './types';
import { componentName, endpointUrl, projectName } from './render';
import { AgentError } from './redact';

export const dependencyOrder = <T extends { id: string; dependsOn: string[] }>(
    components: readonly T[]
): T[] => {
    const byId = new Map(components.map((component): [string, T] => [component.id, component]));
    const ordered: T[] = [];
    const visited = new Set<string>();
    const visit = (component: T): void => {
        if (visited.has(component.id)) return;
        visited.add(component.id);
        for (const id of component.dependsOn) {
            const dependency = byId.get(id);
            if (dependency) visit(dependency);
        }
        ordered.push(component);
    };
    components.forEach(visit);
    return ordered;
};

export const tcpProbe = (host: string, port: number, timeout: number): Promise<boolean> =>
    new Promise((resolve): void => {
        const socket = connect({ host, port });
        const finish = (healthy: boolean): void => {
            socket.destroy();
            resolve(healthy);
        };
        socket.setTimeout(timeout);
        socket.once('connect', (): void => finish(true));
        socket.once('error', (): void => finish(false));
        socket.once('timeout', (): void => finish(false));
    });
const httpProbe = async (url: string, timeout: number, expected?: number): Promise<boolean> => {
    try {
        const response = await fetch(url, {
            method: 'GET',
            redirect: 'manual',
            signal: AbortSignal.timeout(timeout),
        });
        await response.body?.cancel();
        return expected === undefined ? response.ok : response.status === expected;
    } catch {
        return false;
    }
};
export type HealthProbe = (deployment: Deployment, budget: () => number) => Promise<Observation>;
/** Agent attaches only for probes. Workload containers never join the control-plane network. */
export const createHealthProbe = (run: Runner, agentContainer: string): HealthProbe => {
    const cache = new Map<string, { at: number; healthy: boolean; ip?: string }>();
    return async (deployment, budget): Promise<Observation> => {
        const { operation, spec, ports } = deployment;
        const network = `${projectName(operation.deploymentId)}-private`;
        const ips = new Map<string, string>();
        const components: Observation['components'] = [];
        const endpoints: Observation['endpoints'] = [];
        try {
            const connected = await run(
                [
                    'inspect',
                    '--format',
                    `{{if index .NetworkSettings.Networks "${network}"}}true{{else}}false{{end}}`,
                    agentContainer,
                ],
                Math.min(5000, budget())
            );
            if (connected.trim() !== 'true')
                await run(
                    ['network', 'connect', network, agentContainer],
                    Math.min(5000, budget())
                );
            const healthyById = new Map<string, boolean>();
            for (const component of dependencyOrder(spec.components)) {
                // Probing a dependent before its dependencies are healthy can crash upstream
                // services (DCC issuer-coordinator's GET / fails hard while the signer is down).
                if (component.dependsOn.some((id): boolean => healthyById.get(id) !== true)) {
                    healthyById.set(component.id, false);
                    components.push({ id: component.id, healthy: false });
                    continue;
                }
                const key = `${operation.deploymentId}:${operation.specRevision}:${component.id}`;
                const cached = cache.get(key);
                if (cached && Date.now() - cached.at < component.healthcheck.intervalMs) {
                    if (cached.ip) ips.set(component.id, cached.ip);
                    healthyById.set(component.id, cached.healthy);
                    components.push({ id: component.id, healthy: cached.healthy });
                    continue;
                }
                let healthy = false;
                const timeout = Math.min(component.healthcheck.timeoutMs, budget());
                const name = componentName(operation.deploymentId, component.id);
                try {
                    const data = z
                        .object({ running: z.boolean(), revision: z.string(), ip: z.ipv4() })
                        .parse(
                            JSON.parse(
                                await run(
                                    [
                                        'inspect',
                                        '--format',
                                        `{"running":{{.State.Running}},"revision":{{json (index .Config.Labels "org.learncard.workload.revision")}},"ip":{{json (index .NetworkSettings.Networks "${network}").IPAddress}}}`,
                                        name,
                                    ],
                                    Math.min(5000, budget())
                                )
                            )
                        );
                    if (data.running && data.revision === String(operation.specRevision)) {
                        ips.set(component.id, data.ip);
                        const check = component.healthcheck;
                        if (check.kind === 'exec') {
                            await run(['exec', name, ...check.argv], timeout);
                            healthy = true;
                        } else {
                            const port = component.ports.find(
                                (p): boolean => p.name === check.port
                            );
                            if (port?.protocol === 'tcp')
                                healthy =
                                    check.kind === 'tcp'
                                        ? await tcpProbe(data.ip, port.containerPort, timeout)
                                        : await httpProbe(
                                              `http://${data.ip}:${port.containerPort}${check.path}`,
                                              timeout,
                                              check.expectStatus
                                          );
                        }
                    }
                } catch (error) {
                    if (error instanceof AgentError && error.code === 'LEASE_BUDGET_EXCEEDED')
                        throw error;
                }
                healthyById.set(component.id, healthy);
                components.push({ id: component.id, healthy });
                cache.set(key, { at: Date.now(), healthy, ip: ips.get(component.id) });
            }
            for (const endpoint of spec.endpoints) {
                const host = ips.get(endpoint.component);
                const port = spec.components
                    .find((c): boolean => c.id === endpoint.component)!
                    .ports.find((p): boolean => p.name === endpoint.port)!.containerPort;
                const timeout = Math.min(2000, budget());
                const healthy =
                    !!host &&
                    (endpoint.protocol === 'tcp'
                        ? await tcpProbe(host, port, timeout)
                        : await httpProbe(
                              `${endpoint.protocol}://${host}:${port}${endpoint.readiness?.path ?? endpoint.path}`,
                              timeout,
                              endpoint.readiness
                                  ? (endpoint.readiness.expectStatus ?? 200)
                                  : undefined
                          ));
                endpoints.push({
                    id: endpoint.id,
                    url: endpointUrl(spec, operation.deploymentId, endpoint.id, ports),
                    healthy,
                });
            }
            return { observedRevision: operation.specRevision, components, endpoints };
        } finally {
            await run(['network', 'disconnect', network, agentContainer], 5000);
        }
    };
};
