/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Integrationmethod_Featurebatchops4Inputs */

const en_developerportal_onboarding_integrationmethod_featurebatchops4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featurebatchops4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Batch operations supported`)
};

const es_developerportal_onboarding_integrationmethod_featurebatchops4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featurebatchops4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Operaciones por lote compatibles`)
};

const fr_developerportal_onboarding_integrationmethod_featurebatchops4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featurebatchops4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Opérations par lots prises en charge`)
};

const ar_developerportal_onboarding_integrationmethod_featurebatchops4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featurebatchops4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عمليات دفعية مدعومة`)
};

/**
* | output |
* | --- |
* | "Batch operations supported" |
*
* @param {Developerportal_Onboarding_Integrationmethod_Featurebatchops4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_integrationmethod_featurebatchops4 = /** @type {((inputs?: Developerportal_Onboarding_Integrationmethod_Featurebatchops4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Integrationmethod_Featurebatchops4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_integrationmethod_featurebatchops4(inputs)
	if (locale === "es") return es_developerportal_onboarding_integrationmethod_featurebatchops4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_integrationmethod_featurebatchops4(inputs)
	return ar_developerportal_onboarding_integrationmethod_featurebatchops4(inputs)
});
export { developerportal_onboarding_integrationmethod_featurebatchops4 as "developerPortal.onboarding.integrationMethod.featureBatchOps" }