/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Integrationmethod_Webhook2Inputs */

const en_developerportal_onboarding_integrationmethod_webhook2 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Webhook2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Webhook Integration`)
};

const es_developerportal_onboarding_integrationmethod_webhook2 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Webhook2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Integración Webhook`)
};

const fr_developerportal_onboarding_integrationmethod_webhook2 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Webhook2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Intégration Webhook`)
};

const ar_developerportal_onboarding_integrationmethod_webhook2 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Webhook2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تكامل Webhook`)
};

/**
* | output |
* | --- |
* | "Webhook Integration" |
*
* @param {Developerportal_Onboarding_Integrationmethod_Webhook2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_integrationmethod_webhook2 = /** @type {((inputs?: Developerportal_Onboarding_Integrationmethod_Webhook2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Integrationmethod_Webhook2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_integrationmethod_webhook2(inputs)
	if (locale === "es") return es_developerportal_onboarding_integrationmethod_webhook2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_integrationmethod_webhook2(inputs)
	return ar_developerportal_onboarding_integrationmethod_webhook2(inputs)
});
export { developerportal_onboarding_integrationmethod_webhook2 as "developerPortal.onboarding.integrationMethod.webhook" }