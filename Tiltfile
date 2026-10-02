load('ext://restart_process', 'docker_build_with_restart')
load('ext://uibutton', 'cmd_button')

local('KUBECONFIG="$HOME/.kube/config" kubectl config use-context kind-personal-website', quiet=True, echo_off=True)
allow_k8s_contexts('kind-personal-website')

# Docker Desktop restarts bring ctlptl-registry back without its kind network attachment, and
# `ctlptl apply` does not repair it, so image pulls fail with "lookup ctlptl-registry: no such host".
local(
    "docker network inspect kind --format '{{range .Containers}}{{.Name}} {{end}}' | grep -q ctlptl-registry" +
    " || docker network connect kind ctlptl-registry",
    quiet=True,
    echo_off=True,
)


def tailnet_hosts():
    status = str(local('tailscale status --self --json 2>/dev/null || true', quiet=True, echo_off=True)).strip()
    if not status:
        return []
    node = decode_json(status).get('Self', {})
    dns_name = node.get('DNSName', '').rstrip('.')
    short_name = dns_name.split('.')[0]
    ips = node.get('TailscaleIPs', [])
    return [host for host in [dns_name, short_name] + ips[:1] if host]


TAILNET_HOSTS = tailnet_hosts()
DEV_HOSTS = ['localhost', '127.0.0.1'] + TAILNET_HOSTS

if TAILNET_HOSTS:
    alternates = ''.join([' (or http://%s:3000)' % host for host in TAILNET_HOSTS[1:]])
    print('Share this dev site on your tailnet: http://%s:3000%s' % (TAILNET_HOSTS[0], alternates))

docker_build_with_restart(
    ref='personal-website-api',
    context='.',
    dockerfile='src/api/dockerfiles/base.Dockerfile',
    entrypoint=['uv', 'run', 'python', 'main.py'],
    live_update=[
        sync('src/api/src/', '/app/src/api/src/'),
    ]
)

docker_build_with_restart(
    ref='personal-website-frontend',
    context='src/frontend',
    dockerfile='dockerfiles/frontend.Dockerfile',
    target='dev',
    entrypoint=['npm', 'run', 'dev'],
    live_update=[
        sync('src/frontend/src/', '/app/src/'),
    ]
)

k8s_yaml('k8s/namespace.yaml')
k8s_resource(objects=['personal-website:namespace'], new_name='system')

api_config = decode_yaml(read_file('k8s/api/configmap.yaml'))
api_config['data']['APP_CORS_ORIGINS'] = str(encode_json(['http://%s:3000' % host for host in DEV_HOSTS]))
k8s_yaml(encode_yaml(api_config))

# Dev-only Secret built from the template. Admin login needs an argon2 hash in your shell's ADMIN_AUTH_PASSWORD_HASH
# (`make -C src/api hash-password`); without one, login answers 503. The revalidation secret is a
# fixed dev placeholder shared by the API and the frontend.
api_secrets = decode_yaml(read_file('k8s/api/secret.example.yaml'))
api_secrets['stringData']['ADMIN_AUTH_PASSWORD_HASH'] = os.getenv('ADMIN_AUTH_PASSWORD_HASH', '')
api_secrets['stringData']['REVALIDATE_SECRET'] = 'dev-revalidate-secret'
k8s_yaml(encode_yaml(api_secrets))

k8s_yaml('k8s/api/pvc.yaml')
k8s_yaml('k8s/api/deployment.yaml')
k8s_yaml('k8s/api/service.yaml')

frontend_deployment = decode_yaml(read_file('k8s/frontend/deployment.yaml'))
frontend_deployment['spec']['template']['spec']['containers'][0]['env'].append({
    'name': 'ALLOWED_DEV_ORIGINS',
    'value': ','.join(DEV_HOSTS),
})
k8s_yaml(encode_yaml(frontend_deployment))

k8s_yaml('k8s/frontend/service.yaml')

k8s_resource(
    'personal-website-api',
    objects=[
        'personal-website-api-config:configmap',
        'personal-website-api-secrets:secret',
        'personal-website-api-data:persistentvolumeclaim',
    ],
    port_forwards='0.0.0.0:8000:8000',
)
k8s_resource(
    'personal-website-frontend',
    port_forwards='0.0.0.0:3000:3000',
)

cmd_button(
    name='generate-types',
    resource='personal-website-frontend',
    text='Generate Types',
    argv=['sh', '-c', 'cd src/frontend && npm run openapi:gen'],
)
