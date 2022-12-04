import { CeramicArgs } from '@wallet/plugins/ceramic/types';
import { IDXArgs } from '@wallet/plugins/idx/types';
import { EthereumConfig } from '@wallet/plugins/EthereumPlugin/types';
import { DWNConfig } from './plugins/dwn/types';

export const defaultCeramicIDXArgs: CeramicArgs & IDXArgs = {
    modelData: {
        definitions: {
            MyVerifiableCredentials:
                'kjzl6cwe1jw14am5tu5hh412s19o4zm8aq3g2lpd6s4paxj2nly2lj4drp3pun2',
        },
        schemas: {
            AchievementVerifiableCredential:
                'ceramic://k3y52l7qbv1frylibw2725v8gem3hxs1onoh6pvux0szdduugczh0hddxo6qsd6o0',
            VerifiableCredentialsList:
                'ceramic://k3y52l7qbv1frxkcwfpyauky3fyl4n44izridy3blvjjzgftis40sk9w8g3remghs',
        },
        tiles: {},
    },
    credentialAlias: 'MyVerifiableCredentials',
    ceramicEndpoint: 'https://ceramic-node.welibrary.io:7007',
    defaultContentFamily: 'SuperSkills',
};

export const defaultEthereumArgs: EthereumConfig = {
    infuraProjectId: '',
    network: 'mainnet',
};

export const defaultDWNArgs: DWNConfig = {
    dwnAddressURL: new URL('http://localhost:8080'),
    // TODO: a lot more schemas available from https://1edtech.github.io/openbadges-specification/ob_v3p0.html
    schemas: { AchievementVerifiableCredential: 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json' }
};
