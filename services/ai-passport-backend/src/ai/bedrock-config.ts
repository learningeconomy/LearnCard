export const BEDROCK_RUNTIME_ENDPOINT = 'https://bedrock-runtime.us-east-1.amazonaws.com';
export const BEDROCK_CONTROL_ENDPOINT = 'https://bedrock.us-east-1.amazonaws.com';
export const BEDROCK_TIMEOUT_MS = 15_000;
export const BEDROCK_MAX_ATTEMPTS = 1;

export class BedrockConfigurationError extends Error {
    constructor() {
        super('Managed privacy configuration unavailable');
        this.name = 'BedrockConfigurationError';
    }
}

const getRegion = (environment: NodeJS.ProcessEnv): 'us-east-1' => {
    if (
        environment.AWS_REGION !== 'us-east-1' ||
        ['AWS_ENDPOINT_URL', 'AWS_ENDPOINT_URL_BEDROCK', 'AWS_ENDPOINT_URL_BEDROCK_RUNTIME'].some(
            key => Boolean(environment[key])
        )
    )
        throw new BedrockConfigurationError();
    return 'us-east-1';
};

export const getBedrockGuardrailConfig = (
    environment: NodeJS.ProcessEnv = process.env
): BedrockGuardrailConfig => {
    const region = getRegion(environment);
    const guardrailIdentifier = environment.BEDROCK_GUARDRAIL_ID ?? '';
    const guardrailVersion = environment.BEDROCK_GUARDRAIL_VERSION ?? '';
    if (
        !/^(?:[a-z0-9]{1,64}|arn:aws:bedrock:us-east-1:[0-9]{12}:guardrail\/[a-z0-9]{1,64})$/.test(
            guardrailIdentifier
        ) ||
        !/^[1-9][0-9]{0,7}$/.test(guardrailVersion)
    )
        throw new BedrockConfigurationError();
    return { region, guardrailIdentifier, guardrailVersion };
};

export type BedrockGuardrailConfig = {
    region: 'us-east-1';
    guardrailIdentifier: string;
    guardrailVersion: string;
};

// Identity, contact, authentication, financial and government identifiers.
// Not AGE, URL, broad dates, organizations, or isolated geography: these carry
// useful learning context. ADDRESS means a physical address, not a city alone.
export const PRIVACY_PII_TYPES = [
    'ADDRESS',
    'NAME',
    'EMAIL',
    'PHONE',
    'USERNAME',
    'PASSWORD',
    'DRIVER_ID',
    'LICENSE_PLATE',
    'VEHICLE_IDENTIFICATION_NUMBER',
    'CREDIT_DEBIT_CARD_CVV',
    'CREDIT_DEBIT_CARD_EXPIRY',
    'CREDIT_DEBIT_CARD_NUMBER',
    'PIN',
    'INTERNATIONAL_BANK_ACCOUNT_NUMBER',
    'SWIFT_CODE',
    'IP_ADDRESS',
    'MAC_ADDRESS',
    'AWS_ACCESS_KEY',
    'AWS_SECRET_KEY',
    'US_BANK_ACCOUNT_NUMBER',
    'US_BANK_ROUTING_NUMBER',
    'US_INDIVIDUAL_TAX_IDENTIFICATION_NUMBER',
    'US_PASSPORT_NUMBER',
    'US_SOCIAL_SECURITY_NUMBER',
    'CA_HEALTH_NUMBER',
    'CA_SOCIAL_INSURANCE_NUMBER',
    'UK_NATIONAL_HEALTH_SERVICE_NUMBER',
    'UK_NATIONAL_INSURANCE_NUMBER',
    'UK_UNIQUE_TAXPAYER_REFERENCE_NUMBER',
] as const;
