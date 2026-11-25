import { migrateLegacyConsentFlowContracts } from '../src/helpers/consentflow-legacy-migration.helpers';

try {
    await migrateLegacyConsentFlowContracts();
    console.info('ConsentFlow contract version migration completed.');
} catch (error) {
    console.error('ConsentFlow contract version migration failed.', error);
    process.exitCode = 1;
}
