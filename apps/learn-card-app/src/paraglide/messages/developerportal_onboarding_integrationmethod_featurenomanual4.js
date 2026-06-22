/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Integrationmethod_Featurenomanual4Inputs */

const en_developerportal_onboarding_integrationmethod_featurenomanual4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featurenomanual4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No manual intervention needed`)
};

const es_developerportal_onboarding_integrationmethod_featurenomanual4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featurenomanual4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se necesita intervención manual`)
};

const fr_developerportal_onboarding_integrationmethod_featurenomanual4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featurenomanual4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune intervention manuelle nécessaire`)
};

const ar_developerportal_onboarding_integrationmethod_featurenomanual4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featurenomanual4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا حاجة للتدخل اليدوي`)
};

/**
* | output |
* | --- |
* | "No manual intervention needed" |
*
* @param {Developerportal_Onboarding_Integrationmethod_Featurenomanual4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_integrationmethod_featurenomanual4 = /** @type {((inputs?: Developerportal_Onboarding_Integrationmethod_Featurenomanual4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Integrationmethod_Featurenomanual4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_integrationmethod_featurenomanual4(inputs)
	if (locale === "es") return es_developerportal_onboarding_integrationmethod_featurenomanual4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_integrationmethod_featurenomanual4(inputs)
	return ar_developerportal_onboarding_integrationmethod_featurenomanual4(inputs)
});
export { developerportal_onboarding_integrationmethod_featurenomanual4 as "developerPortal.onboarding.integrationMethod.featureNoManual" }