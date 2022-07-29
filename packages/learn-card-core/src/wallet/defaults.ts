import { CeramicIDXArgs } from 'types/LearnCard';
import { EthereumConfig } from './plugins/EthereumPlugin/types';

export const defaultCeramicIDXArgs: CeramicIDXArgs = {
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
    address: '',
    infuraProjectId: '',
    network: 'mainnet',
};
