/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Integrationmethod_Featuremigration3Inputs */

const en_developerportal_onboarding_integrationmethod_featuremigration3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featuremigration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Great for initial migration`)
};

const es_developerportal_onboarding_integrationmethod_featuremigration3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featuremigration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ideal para migración inicial`)
};

const fr_developerportal_onboarding_integrationmethod_featuremigration3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featuremigration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Idéal pour la migration initiale`)
};

const ar_developerportal_onboarding_integrationmethod_featuremigration3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featuremigration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ممتاز للترحيل الأولي`)
};

/**
* | output |
* | --- |
* | "Great for initial migration" |
*
* @param {Developerportal_Onboarding_Integrationmethod_Featuremigration3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_integrationmethod_featuremigration3 = /** @type {((inputs?: Developerportal_Onboarding_Integrationmethod_Featuremigration3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Integrationmethod_Featuremigration3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_integrationmethod_featuremigration3(inputs)
	if (locale === "es") return es_developerportal_onboarding_integrationmethod_featuremigration3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_integrationmethod_featuremigration3(inputs)
	return ar_developerportal_onboarding_integrationmethod_featuremigration3(inputs)
});
export { developerportal_onboarding_integrationmethod_featuremigration3 as "developerPortal.onboarding.integrationMethod.featureMigration" }