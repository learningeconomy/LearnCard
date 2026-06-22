/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Integrationmethod_Restapi3Inputs */

const en_developerportal_onboarding_integrationmethod_restapi3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Restapi3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`REST API`)
};

const es_developerportal_onboarding_integrationmethod_restapi3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Restapi3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`API REST`)
};

const fr_developerportal_onboarding_integrationmethod_restapi3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Restapi3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`API REST`)
};

const ar_developerportal_onboarding_integrationmethod_restapi3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Restapi3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`REST API`)
};

/**
* | output |
* | --- |
* | "REST API" |
*
* @param {Developerportal_Onboarding_Integrationmethod_Restapi3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_integrationmethod_restapi3 = /** @type {((inputs?: Developerportal_Onboarding_Integrationmethod_Restapi3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Integrationmethod_Restapi3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_integrationmethod_restapi3(inputs)
	if (locale === "es") return es_developerportal_onboarding_integrationmethod_restapi3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_integrationmethod_restapi3(inputs)
	return ar_developerportal_onboarding_integrationmethod_restapi3(inputs)
});
export { developerportal_onboarding_integrationmethod_restapi3 as "developerPortal.onboarding.integrationMethod.restApi" }