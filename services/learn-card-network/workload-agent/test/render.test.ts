import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { config, plan, secret } from './fixtures';
import { componentName, parseSpec, projectName, render, safeName } from '../src/render';
import { loadConfig } from '../src/config';

describe('restricted renderer', (): void => {
    it('renders only declared users and tmpfs and resolves private hostport', (): void => {
        const p = plan();
        const original = parse(
            render(parseSpec(JSON.stringify(p), config()), 'id', 1, config(), {}).yaml
        );
        expect(original.services[safeName('web')]).not.toHaveProperty('user');
        expect(original.services[safeName('web')]).not.toHaveProperty('tmpfs');
        Object.assign(p.execution!.components[0]!, {
            user: '999:999',
            tmpfs: [{ path: '/tmp', sizeMiB: 64 }],
            env: [
                {
                    name: 'SERVICE',
                    source: { kind: 'endpoint', endpointId: 'web', part: 'hostport' },
                },
            ],
        });
        const service = parse(
            render(parseSpec(JSON.stringify(p), config()), 'id', 1, config(), {}).yaml
        ).services[safeName('web')];
        expect(service.user).toBe('999:999');
        expect(service.tmpfs).toEqual(['/tmp:rw,noexec,nosuid,size=64m']);
        expect(service.environment.SERVICE).toBe(`${componentName('id', 'web')}:5678`);
    });
    it.each(['0', '00:999', 'root', '999:root', '-1', '12345678901'])(
        'rejects unsafe user %s',
        (user): void => {
            const p = plan();
            p.execution!.components[0]!.user = user;
            expect((): unknown => parseSpec(JSON.stringify(p), config())).toThrow('SPEC_INVALID');
        }
    );
    it.each([
        { tmpfs: [{ path: '/tmp', sizeMiB: 0 }] },
        { tmpfs: [{ path: '/tmp', sizeMiB: 1025 }] },
        { tmpfs: [{ path: 'tmp', sizeMiB: 64 }] },
        { tmpfs: [{ path: '/tmp:exec', sizeMiB: 64 }] },
        { tmpfs: [{ path: '/tmp,size=999g', sizeMiB: 64 }] },
        {
            tmpfs: Array.from({ length: 17 }, (_, i): { path: string; sizeMiB: number } => ({
                path: `/tmp/${i}`,
                sizeMiB: 1,
            })),
        },
    ])('rejects invalid tmpfs bounds', ({ tmpfs }): void => {
        const p = plan();
        p.execution!.components[0]!.tmpfs = tmpfs;
        expect((): unknown => parseSpec(JSON.stringify(p), config())).toThrow('SPEC_INVALID');
    });
    it.each(['/', '/proc', '/etc/shadow', '/tmp/../etc'])(
        'rejects forbidden tmpfs %s',
        (path): void => {
            const p = plan();
            p.execution!.components[0]!.tmpfs = [{ path, sizeMiB: 64 }];
            expect((): unknown => parseSpec(JSON.stringify(p), config())).toThrow(
                'MOUNT_FORBIDDEN'
            );
        }
    );
    it('only emits restricted compose, private network and loopback publication', (): void => {
        const spec = parseSpec(JSON.stringify(plan()), config());
        const rendered = render(spec, 'D/1', 2, config(), { 'web:http': 21001 });
        const document = parse(rendered.yaml);
        const service = document.services[safeName('web')];
        expect(service.cap_drop).toEqual(['ALL']);
        expect(service.security_opt).toEqual(['no-new-privileges:true']);
        expect(service.read_only).toBe(true);
        expect(service.ports).toEqual([
            { target: 5678, published: '21001', host_ip: '127.0.0.1', protocol: 'tcp' },
        ]);
        expect(service.networks).toEqual(['private']);
        expect(document.networks.private.internal).toBe(true);
        for (const forbidden of ['privileged', 'network_mode', 'pid', 'build'])
            expect(service).not.toHaveProperty(forbidden);
        expect(rendered.yaml).not.toContain('docker.sock');
        expect(service.volumes.every((v: { type: string }): boolean => v.type === 'volume')).toBe(
            true
        );
    });
    it('internal endpoints are never published', (): void => {
        const spec = parseSpec(JSON.stringify(plan()), config());
        spec.endpoints[0]!.visibility = 'internal';
        expect(
            parse(render(spec, 'id', 1, config(), {}).yaml).services[safeName('web')].ports
        ).toEqual([]);
    });
    it('names are deterministic and normalization is collision resistant', (): void => {
        expect(projectName('A/b')).toBe(projectName('A/b'));
        expect(projectName('A/b')).not.toBe(projectName('a-b'));
        const spec = parseSpec(JSON.stringify(plan()), config());
        expect(render(spec, 'id', 1, config(), {}).yaml).toContain(
            `${projectName('id')}-${safeName('data')}`
        );
    });
    it('references secrets only through external env files', (): void => {
        const p = plan();
        p.execution!.secretRefs = [secret()];
        p.execution!.components[0]!.env = [
            { name: 'KEY', source: { kind: 'secret', name: 'key' } },
        ];
        const result = render(parseSpec(JSON.stringify(p), config()), 'id', 1, config(), {});
        const service = parse(result.yaml).services[safeName('web')];
        expect(service.env_file[0].format).toBe('raw');
        expect(service.environment).not.toHaveProperty('KEY');
    });
    it('rejects tag-only images', (): void => {
        const p = plan();
        p.execution!.components[0]!.image = 'docker.io/hashicorp/http-echo:latest';
        expect((): void => {
            parseSpec(JSON.stringify(p), config());
        }).toThrow('SPEC_INVALID');
    });
    it('rejects a digest outside the allowlist', (): void => {
        expect((): void => {
            parseSpec(JSON.stringify(plan()), {
                ...config(),
                WORKLOAD_IMAGE_ALLOWLIST: 'docker.io/library/',
            });
        }).toThrow('IMAGE_NOT_ALLOWED');
    });
    it('enforces independent resource ceilings', (): void => {
        expect((): void => {
            parseSpec(JSON.stringify(plan()), { ...config(), WORKLOAD_MAX_CPU_MILLIS: 1 });
        }).toThrow('RESOURCE_CEILING_EXCEEDED');
    });
    it.each(['privileged', 'network_mode', 'pid', 'build', 'user'])(
        'rejects undeclared field %s',
        (field): void => {
            const p = plan();
            p.execution!.components[0]![field] = true;
            expect((): void => {
                parseSpec(JSON.stringify(p), config());
            }).toThrow('SPEC_INVALID');
        }
    );
    it('rejects legacy review-only approvals', (): void => {
        const p = plan();
        delete p.execution;
        expect((): void => {
            parseSpec(JSON.stringify(p), config());
        }).toThrow('APPROVAL_EXECUTION_MISSING');
    });
    it('escapes compose interpolation in literal values', (): void => {
        const p = plan();
        p.execution!.components[0]!.env = [
            { name: 'TEXT', source: { kind: 'literal', value: '$HOME' } },
        ];
        expect(
            render(parseSpec(JSON.stringify(p), config()), 'id', 1, config(), {}).yaml
        ).toContain('$$HOME');
    });
    it('refuses production and requires explicit opt-in', (): void => {
        expect((): void => {
            loadConfig({ NODE_ENV: 'production' });
        }).toThrow('PRODUCTION_FORBIDDEN');
        expect((): void => {
            loadConfig({ WORKLOAD_PRODUCTION: '1' });
        }).toThrow('PRODUCTION_FORBIDDEN');
        expect((): void => {
            loadConfig({});
        }).toThrow('CONFIG_INVALID');
    });
});
