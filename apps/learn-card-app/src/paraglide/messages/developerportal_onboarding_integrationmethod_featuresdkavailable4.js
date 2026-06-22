/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Integrationmethod_Featuresdkavailable4Inputs */

const en_developerportal_onboarding_integrationmethod_featuresdkavailable4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featuresdkavailable4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`SDK available for Node.js`)
};

const es_developerportal_onboarding_integrationmethod_featuresdkavailable4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featuresdkavailable4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`SDK disponible para Node.js`)
};

const fr_developerportal_onboarding_integrationmethod_featuresdkavailable4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featuresdkavailable4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`SDK disponible pour Node.js`)
};

const ar_developerportal_onboarding_integrationmethod_featuresdkavailable4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featuresdkavailable4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`SDK متاح لـ Node.js`)
};

/**
* | output |
* | --- |
* | "SDK available for Node.js" |
*
* @param {Developerportal_Onboarding_Integrationmethod_Featuresdkavailable4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_integrationmethod_featuresdkavailable4 = /** @type {((inputs?: Developerportal_Onboarding_Integrationmethod_Featuresdkavailable4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Integrationmethod_Featuresdkavailable4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_integrationmethod_featuresdkavailable4(inputs)
	if (locale === "es") return es_developerportal_onboarding_integrationmethod_featuresdkavailable4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_integrationmethod_featuresdkavailable4(inputs)
	return ar_developerportal_onboarding_integrationmethod_featuresdkavailable4(inputs)
});
export { developerportal_onboarding_integrationmethod_featuresdkavailable4 as "developerPortal.onboarding.integrationMethod.featureSdkAvailable" }