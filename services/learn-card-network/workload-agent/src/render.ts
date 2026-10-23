import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { stringify } from 'yaml';
import { z } from 'zod';
import { WorkloadPlanValidator } from '../../../../packages/learn-card-types/src/education-os';
import {
    WorkloadComponentValidator,
    WorkloadEndpointDeclarationValidator,
    WorkloadSecretDeclarationValidator,
} from '../../../../packages/learn-card-types/src/workload';
import type { AgentConfig } from './config';
import { AgentError } from './redact';

const executionSchema = z
    .object({
        components: z.array(WorkloadComponentValidator).min(1).max(256),
        secretRefs: z.array(WorkloadSecretDeclarationValidator).max(256),
        config: z.record(z.string(), z.unknown()),
    })
    .strict();
export type Execution = z.infer<typeof executionSchema>;
export interface Spec extends Execution {
    endpoints: z.infer<typeof WorkloadEndpointDeclarationValidator>[];
}
export const safeName = (id: string): string =>
    `${id
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .slice(0, 35)}-${createHash('sha256').update(id).digest('hex').slice(0, 12)}`;
export const projectName = (id: string): string => `lcnwl-${safeName(id)}`;
export const componentName = (deployment: string, component: string): string =>
    `${projectName(deployment)}-${safeName(component)}`;
export const portKey = (component: string, port: string): string => `${component}:${port}`;
export const initialPort = (deployment: string, key: string): number =>
    20000 + (createHash('sha256').update(`${deployment}:${key}`).digest().readUInt32BE(0) % 30000);

export const parseSpec = (json: string, config: AgentConfig): Spec => {
    try {
        const plan = WorkloadPlanValidator.parse(JSON.parse(json));
        if (!plan.execution) throw new AgentError('APPROVAL_EXECUTION_MISSING');
        const execution = executionSchema.parse(plan.execution);
        const endpoints = WorkloadEndpointDeclarationValidator.array().parse(plan.endpoints);
        const allow = config.WORKLOAD_IMAGE_ALLOWLIST.split(',')
            .map((s): string => s.trim())
            .filter(Boolean);
        const ids = new Set(execution.components.map((c): string => c.id));
        const visiting = new Set<string>();
        const visited = new Set<string>();
        const visit = (id: string): void => {
            if (visiting.has(id)) throw new AgentError('SPEC_INVALID');
            if (visited.has(id)) return;
            const component = execution.components.find((c): boolean => c.id === id);
            if (!component) throw new AgentError('SPEC_INVALID');
            visiting.add(id);
            component.dependsOn.forEach(visit);
            visiting.delete(id);
            visited.add(id);
        };
        ids.forEach(visit);
        if (ids.size !== execution.components.length || ids.size !== plan.components.length)
            throw new AgentError('SPEC_INVALID');
        for (const component of execution.components) {
            if (
                !plan.components.some(
                    (c): boolean =>
                        c.id === component.id &&
                        c.image === component.image &&
                        c.platform === component.platform
                )
            )
                throw new AgentError('SPEC_INVALID');
            const repository = component.image.split('@')[0]!;
            if (
                !allow.some((entry): boolean =>
                    entry.includes('@sha256:')
                        ? entry === component.image
                        : repository === entry ||
                          (entry.endsWith('/') && repository.startsWith(entry))
                )
            )
                throw new AgentError('IMAGE_NOT_ALLOWED');
            const r = component.resources;
            if (
                r.cpuMillis > config.WORKLOAD_MAX_CPU_MILLIS ||
                r.memoryMiB > config.WORKLOAD_MAX_MEMORY_MIB ||
                r.pids > config.WORKLOAD_MAX_PIDS
            )
                throw new AgentError('RESOURCE_CEILING_EXCEEDED');
            if (component.dependsOn.some((id): boolean => !ids.has(id)))
                throw new AgentError('SPEC_INVALID');
            const mountPaths = [
                ...component.volumes.map((volume): string => volume.mountPath),
                ...(component.tmpfs ?? []).map((mount): string => mount.path),
            ];
            if (new Set(mountPaths).size !== mountPaths.length)
                throw new AgentError('MOUNT_FORBIDDEN');
            for (const mountPath of mountPaths) {
                if (
                    mountPath === '/' ||
                    /(^|\/)\.\.?($|\/)/.test(mountPath) ||
                    /^\/(proc|sys|dev|etc|run)(\/|$)/.test(mountPath)
                )
                    throw new AgentError('MOUNT_FORBIDDEN');
            }
            for (const entry of component.env) {
                if (entry.source.kind === 'endpoint' && entry.source.address === 'published') {
                    const endpointId = entry.source.endpointId;
                    const target = endpoints.find((e): boolean => e.id === endpointId);
                    if (
                        !target ||
                        target.visibility === 'internal' ||
                        (target.protocol !== 'http' && target.protocol !== 'https')
                    )
                        throw new AgentError('SPEC_INVALID');
                }
                if (entry.source.kind === 'secret') {
                    const name = entry.source.name;
                    if (
                        !execution.secretRefs.some(
                            (s): boolean => s.name === name && s.consumers.includes(component.id)
                        )
                    )
                        throw new AgentError('SPEC_INVALID');
                }
            }
        }
        if (new Set(endpoints.map((e): string => e.id)).size !== endpoints.length)
            throw new AgentError('SPEC_INVALID');
        for (const endpoint of endpoints) {
            const component = execution.components.find(
                (c): boolean => c.id === endpoint.component
            );
            if (
                component?.lifecycle?.kind === 'init' ||
                (endpoint.protocol === 'mongodb' &&
                    endpoints.some(
                        (other): boolean =>
                            other.component === endpoint.component &&
                            other.visibility !== 'internal'
                    )) ||
                !component?.ports.some(
                    (p): boolean => p.name === endpoint.port && p.protocol === 'tcp'
                )
            )
                throw new AgentError('SPEC_INVALID');
        }
        if (
            new Set(execution.secretRefs.map((s): string => s.name)).size !==
            execution.secretRefs.length
        )
            throw new AgentError('SPEC_INVALID');
        return { ...execution, endpoints };
    } catch (error) {
        if (error instanceof AgentError) throw error;
        throw new AgentError('SPEC_INVALID');
    }
};

export const endpointUrl = (
    spec: Spec,
    deployment: string,
    endpointId: string,
    ports?: Record<string, number>
): string => {
    const endpoint = spec.endpoints.find((e): boolean => e.id === endpointId);
    if (!endpoint) throw new AgentError('ENDPOINT_MISSING');
    const component = spec.components.find((c): boolean => c.id === endpoint.component)!;
    const port = component.ports.find((p): boolean => p.name === endpoint.port)!;
    const published = endpoint.visibility !== 'internal' && ports;
    if (published && !ports[portKey(component.id, port.name)])
        throw new AgentError('PORT_UNALLOCATED');
    // The Compose service name, not container_name: container names embed the deployment id
    // and exceed the 63-char DNS label limit, so in-container resolvers reject them.
    const url = `${endpoint.protocol}://${published ? '127.0.0.1' : safeName(component.id)}:${published ? ports[portKey(component.id, port.name)] : port.containerPort}${endpoint.path}`;
    return endpoint.protocol === 'mongodb'
        ? `${url}?directConnection=true&replicaSet=${encodeURIComponent(endpoint.query!.replicaSet)}`
        : url;
};

/**
 * Platform resolver for `address: 'published'` env references. The local-compose driver
 * publishes only on host loopback; a future ingress resolver replaces this function alone.
 */
export const publishedEndpointUrl = (
    spec: Spec,
    deployment: string,
    endpointId: string,
    ports: Record<string, number>
): URL => {
    const url = new URL(endpointUrl(spec, deployment, endpointId, ports));
    if (url.hostname !== '127.0.0.1') throw new AgentError('SPEC_INVALID');
    return url;
};

const effectivePort = (url: URL): string =>
    url.port || (url.protocol === 'https:' ? '443' : url.protocol === 'http:' ? '80' : '');

export interface Rendered {
    yaml: string;
    project: string;
    ports: Record<string, number>;
}
/** Closed renderer: no caller-provided compose fragments or Docker shell healthchecks. */
export const render = (
    spec: Spec,
    deployment: string,
    revision: number,
    config: AgentConfig,
    ports: Record<string, number>,
    attempt?: string
): Rendered => {
    const project = projectName(deployment);
    const services: Record<string, unknown> = {};
    const volumes: Record<string, unknown> = {};
    let needsEdge = false;
    for (const component of spec.components) {
        const environment: Record<string, string> = {};
        for (const entry of component.env) {
            const source = entry.source;
            if (source.kind === 'secret') continue;
            if (source.kind === 'literal') environment[entry.name] = source.value;
            if (source.kind === 'endpoint') {
                const url =
                    source.address === 'published'
                        ? publishedEndpointUrl(spec, deployment, source.endpointId, ports)
                        : new URL(endpointUrl(spec, deployment, source.endpointId));
                environment[entry.name] =
                    source.part === 'url'
                        ? url.href
                        : source.part === 'host'
                          ? url.hostname
                          : source.part === 'hostport'
                            ? url.host
                            : source.part === 'origin'
                              ? url.origin
                              : effectivePort(url);
            }
            if (source.kind === 'config') {
                let value: unknown = spec.config;
                for (const key of source.path.split('.'))
                    value =
                        value && typeof value === 'object' && Object.hasOwn(value, key)
                            ? (value as Record<string, unknown>)[key]
                            : undefined;
                if (!['string', 'number', 'boolean'].includes(typeof value))
                    throw new AgentError('CONFIG_MAPPING_INVALID');
                environment[entry.name] = String(value);
            }
        }
        const mounts: Record<string, unknown>[] = [];
        const tmpfs: string[] = (component.tmpfs ?? []).map(
            (mount): string => `${mount.path}:rw,noexec,nosuid,size=${mount.sizeMiB}m`
        );
        for (const volume of component.volumes) {
            if (volume.persistent) {
                const key = safeName(volume.name);
                volumes[key] = { name: `${project}-${key}` };
                mounts.push({ type: 'volume', source: key, target: volume.mountPath });
            } else tmpfs.push(`${volume.mountPath}:rw,noexec,nosuid,size=64m`);
        }
        const published = [
            ...new Set(
                spec.endpoints
                    .filter(
                        (e): boolean => e.component === component.id && e.visibility !== 'internal'
                    )
                    .map((e): string => e.port)
            ),
        ].map((name): Record<string, unknown> => ({
            target: component.ports.find((p): boolean => p.name === name)!.containerPort,
            published: String(ports[portKey(component.id, name)]),
            host_ip: '127.0.0.1',
            protocol: 'tcp',
        }));
        if (published.length) needsEdge = true;
        services[safeName(component.id)] = {
            image: component.image,
            platform: component.platform,
            ...(component.command === undefined ? {} : { command: component.command }),
            ...(component.user === undefined ? {} : { user: component.user }),
            container_name: componentName(deployment, component.id),
            labels: {
                'org.learncard.workload.deployment': deployment,
                'org.learncard.workload.revision': String(revision),
                'org.learncard.workload.component': component.id,
                ...(attempt ? { 'org.learncard.workload.attempt': attempt } : {}),
            },
            // Docker cannot publish ports from an internal network, so only components with
            // ecosystem/public endpoints also join a non-internal `edge` network (loopback-bound).
            networks: published.length ? ['private', 'edge'] : ['private'],
            depends_on: component.dependsOn.map(safeName),
            restart: component.lifecycle?.kind === 'init' ? 'no' : 'on-failure:5',
            ports: published,
            volumes: mounts,
            ...(tmpfs.length ? { tmpfs } : {}),
            security_opt: ['no-new-privileges:true'],
            cap_drop: ['ALL'],
            read_only: true,
            cpus: component.resources.cpuMillis / 1000,
            mem_limit: `${component.resources.memoryMiB}m`,
            pids_limit: component.resources.pids,
            healthcheck: { disable: true },
            environment,
            ...(component.env.some((e): boolean => e.source.kind === 'secret')
                ? {
                      env_file: [
                          {
                              path: join(
                                  config.WORKLOAD_SECRETS_DIR,
                                  project,
                                  `${safeName(component.id)}.env`
                              ),
                              format: 'raw',
                          },
                      ],
                  }
                : {}),
        };
    }
    // Compose interpolation applies even to YAML-quoted values. Escape all dollar signs.
    return {
        project,
        ports,
        yaml: stringify({
            name: project,
            services,
            networks: {
                private: { name: `${project}-private`, internal: true },
                ...(needsEdge ? { edge: { name: `${project}-edge` } } : {}),
            },
            volumes,
        }).replace(/\$/g, '$$$$'),
    };
};
