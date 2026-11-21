# Shared by disposable hosted and local referral test stacks. No real CA trust stores are changed.
prepare_referral_test_tls() {
    local service_dir="$1"
    REFERRAL_E2E_TLS_DIR="$(mktemp -d)"
    export REFERRAL_E2E_TLS_DIR
    # Trust only the generated certificate in the offline Brain test service, never its key.
    (
        umask 077
        openssl req -x509 -newkey rsa:2048 -nodes -sha256 -days 1 \
            -subj /CN=host.docker.internal \
            -addext subjectAltName=DNS:host.docker.internal \
            -keyout "$REFERRAL_E2E_TLS_DIR/key.pem" -out "$REFERRAL_E2E_TLS_DIR/cert.pem" 2>/dev/null
        chmod 644 "$REFERRAL_E2E_TLS_DIR/cert.pem"
    )
    export COMPOSE_FILE="$service_dir/compose.yaml:$service_dir/compose.referral-tls.yaml"
}

cleanup_referral_test_tls() {
    if [[ -n "${REFERRAL_E2E_TLS_DIR:-}" ]]; then
        rm -rf -- "$REFERRAL_E2E_TLS_DIR"
    fi
}
