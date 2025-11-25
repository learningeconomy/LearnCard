import { useWallet } from 'learn-card-base';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';

export const useSigningAuthority = () => {
    const { initWallet } = useWallet();

    const getRegisteredSigningAuthorities = async (_wallet?: BespokeLearnCard) => {
        const wallet = _wallet ?? (await initWallet());
        const rsas = await wallet?.invoke?.getRegisteredSigningAuthorities();
        return rsas;
    };

    const getPrimaryRegisteredSigningAuthority = async (_wallet?: BespokeLearnCard) => {
        const wallet = _wallet ?? (await initWallet());
        const rsa = await wallet?.invoke?.getPrimaryRegisteredSigningAuthority();
        return rsa;
    };

    const setDefaultSigningAuthority = async (
        _wallet: BespokeLearnCard,
        name: string,
        endpoint: string
    ) => {
        const wallet = _wallet ?? (await initWallet());
        const registeredSigningAuthority =
            await wallet?.invoke.setPrimaryRegisteredSigningAuthority(endpoint, name);
        return registeredSigningAuthority;
    };

    const getRegisteredSigningAuthority = async (_wallet?: BespokeLearnCard, saName = 'lca-sa') => {
        const wallet = _wallet ?? (await initWallet());
        const signingAuthorities = await wallet.invoke.getSigningAuthorities();

        // find existing signing authority
        let sa = signingAuthorities?.find(signingAuthority => signingAuthority?.name === saName);

        if (!sa) {
            // create signing authority
            sa = await wallet?.invoke?.createSigningAuthority(saName);
        }

        // register signing authority
        const rsa = await wallet?.invoke?.registerSigningAuthority(sa?.endpoint, sa?.name, sa?.did);

        return { registeredSigningAuthority: rsa, signingAuthority: sa };
    };

    return {
        getRegisteredSigningAuthority,
        getRegisteredSigningAuthorities,
        getPrimaryRegisteredSigningAuthority,
        setDefaultSigningAuthority,
    };
};

export default useSigningAuthority;
