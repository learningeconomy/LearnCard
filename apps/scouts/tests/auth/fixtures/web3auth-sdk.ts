// Simulated Torus replay/session boundary; no live accounts or key network.
export const CHAIN_NAMESPACES = { EIP155: 'eip155' };
export class EthereumPrivateKeyProvider {}
export class Web3Auth {
    connected = false;
    private userInfo?: { verifierId: string; verifier: string };
    provider = { request: async () => 'synthetic-private-key' };
    async init(): Promise<void> {
        const session = localStorage.getItem('simulated-web3auth-session');
        if (session) {
            this.userInfo = JSON.parse(session);
            this.connected = true;
        }
    }
    async connect(params: {
        verifierId: string;
        verifier: string;
        idToken: string;
    }): Promise<void> {
        const response = await fetch('/connect', { method: 'POST', body: params.idToken });
        if (!response.ok) throw new Error('Error occurred while verifying params token is used');
        this.userInfo = { verifierId: params.verifierId, verifier: params.verifier };
        localStorage.setItem('simulated-web3auth-session', JSON.stringify(this.userInfo));
        this.connected = true;
    }
    async getUserInfo(): Promise<typeof this.userInfo> {
        return this.userInfo;
    }
}
