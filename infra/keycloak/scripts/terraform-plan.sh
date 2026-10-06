#!/usr/bin/env bash
set -euo pipefail
# Run from repo root. Never print raw plans/diagnostics or publish plan artifacts.
root=${1:?Root required}
environment=${DEPLOY_ENVIRONMENT:?Environment required}
: "${TF_STATE_BUCKET:?State bucket required}"
: "${AWS_REGION:?Region required}"
directory="infra/keycloak/terraform/$root"
umask 077
terraform -chdir="$directory" init -input=false \
    -backend-config="bucket=$TF_STATE_BUCKET" \
    -backend-config="key=keycloak/$environment/$root.tfstate" \
    -backend-config="region=$AWS_REGION" -backend-config=encrypt=true \
    -backend-config=use_lockfile=true >"$directory/init.log" 2>&1 || {
    printf 'Terraform init failed; inspect privately, no diagnostics published.\n' >&2; exit 1;
}
terraform -chdir="$directory" plan -input=false -lock-timeout=5m \
    -var-file="environments/$environment.tfvars" -out=keycloak.tfplan \
    >"$directory/plan.log" 2>&1 || {
    printf 'Terraform plan failed; inspect privately, no raw values published.\n' >&2; exit 1;
}
terraform -chdir="$directory" show -json keycloak.tfplan >"$directory/plan.json"
python3 - "$directory/plan.json" "$root" <<'PY'
import html, json, os, sys
with open(sys.argv[1]) as source:
    plan = json.load(source)
changes = [r for r in plan.get('resource_changes', [])
           if r['change']['actions'] not in (['no-op'], ['read'])]
counts = {a: sum(a in r['change']['actions'] for r in changes)
          for a in ('create', 'update', 'delete')}
summary = f"### {sys.argv[2]} plan\n" + ', '.join(f'{k}: {v}' for k,v in counts.items()) + '\n'
# Markdown cannot interpret addresses as markup; omit values, outputs and diagnostics.
summary += '\n'.join('- <code>' + html.escape(r['address']) + '</code>' for r in changes[:100])
if len(changes) > 100:
    summary += '\nAdditional addresses omitted (100-address limit).'
with open(os.environ.get('GITHUB_STEP_SUMMARY', os.devnull), 'a') as destination:
    destination.write(summary + '\n')
print(', '.join(f'{k}: {v}' for k,v in counts.items()))
# Callers (e.g. the drift check) branch on the change count, never on plan content.
if os.environ.get('GITHUB_OUTPUT'):
    with open(os.environ['GITHUB_OUTPUT'], 'a') as output:
        output.write(f"{sys.argv[2].replace('/', '_')}_changes={len(changes)}\n")
PY
