import { accountFeature } from './journeys/account';
import { appStoreFeature } from './journeys/app-store';
import { cliFeature } from './journeys/cli';
import { consentFlowFeature } from './journeys/consent-flow';
import { contactsFeature } from './journeys/contacts';
import { credentialsFeature } from './journeys/credentials';
import { docsFeature } from './journeys/docs';
import { languageFeature } from './journeys/language';
import { sdkFeature } from './journeys/sdk';
import { sdkToAppFeature } from './journeys/sdk-to-app';
import { sharingFeature } from './journeys/sharing';
import type { FeatureDefinition } from './types';

/**
 * The executable coverage contract. `lc verify run all` runs exactly these, in this order; each
 * feature passes only when its journey successfully executes every listed acceptance step.
 */
export const verificationFeatures: FeatureDefinition[] = [
    accountFeature,
    languageFeature,
    credentialsFeature,
    sharingFeature,
    contactsFeature,
    appStoreFeature,
    sdkFeature,
    cliFeature,
    sdkToAppFeature,
    consentFlowFeature,
    docsFeature,
];
