/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Integrationmethod_Featurerealtime3Inputs */

const en_developerportal_onboarding_integrationmethod_featurerealtime3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featurerealtime3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Real-time credential issuance`)
};

const es_developerportal_onboarding_integrationmethod_featurerealtime3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featurerealtime3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emisión de credenciales en tiempo real`)
};

const fr_developerportal_onboarding_integrationmethod_featurerealtime3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featurerealtime3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émission de credentials en temps réel`)
};

const ar_developerportal_onboarding_integrationmethod_featurerealtime3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featurerealtime3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إصدار بيانات الاعتماد في الوقت الفعلي`)
};

/**
* | output |
* | --- |
* | "Real-time credential issuance" |
*
* @param {Developerportal_Onboarding_Integrationmethod_Featurerealtime3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_integrationmethod_featurerealtime3 = /** @type {((inputs?: Developerportal_Onboarding_Integrationmethod_Featurerealtime3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Integrationmethod_Featurerealtime3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_integrationmethod_featurerealtime3(inputs)
	if (locale === "es") return es_developerportal_onboarding_integrationmethod_featurerealtime3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_integrationmethod_featurerealtime3(inputs)
	return ar_developerportal_onboarding_integrationmethod_featurerealtime3(inputs)
});
export { developerportal_onboarding_integrationmethod_featurerealtime3 as "developerPortal.onboarding.integrationMethod.featureRealtime" }