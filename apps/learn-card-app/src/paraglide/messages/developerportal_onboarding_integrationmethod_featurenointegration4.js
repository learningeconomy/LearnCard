/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Integrationmethod_Featurenointegration4Inputs */

const en_developerportal_onboarding_integrationmethod_featurenointegration4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featurenointegration4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No technical integration needed`)
};

const es_developerportal_onboarding_integrationmethod_featurenointegration4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featurenointegration4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se necesita integración técnica`)
};

const fr_developerportal_onboarding_integrationmethod_featurenointegration4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featurenointegration4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune intégration technique nécessaire`)
};

const ar_developerportal_onboarding_integrationmethod_featurenointegration4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featurenointegration4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا حاجة لتكامل تقني`)
};

/**
* | output |
* | --- |
* | "No technical integration needed" |
*
* @param {Developerportal_Onboarding_Integrationmethod_Featurenointegration4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_integrationmethod_featurenointegration4 = /** @type {((inputs?: Developerportal_Onboarding_Integrationmethod_Featurenointegration4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Integrationmethod_Featurenointegration4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_integrationmethod_featurenointegration4(inputs)
	if (locale === "es") return es_developerportal_onboarding_integrationmethod_featurenointegration4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_integrationmethod_featurenointegration4(inputs)
	return ar_developerportal_onboarding_integrationmethod_featurenointegration4(inputs)
});
export { developerportal_onboarding_integrationmethod_featurenointegration4 as "developerPortal.onboarding.integrationMethod.featureNoIntegration" }