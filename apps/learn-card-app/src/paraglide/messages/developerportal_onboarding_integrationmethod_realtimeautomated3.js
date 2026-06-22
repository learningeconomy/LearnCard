/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Integrationmethod_Realtimeautomated3Inputs */

const en_developerportal_onboarding_integrationmethod_realtimeautomated3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Realtimeautomated3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Real-time, automated`)
};

const es_developerportal_onboarding_integrationmethod_realtimeautomated3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Realtimeautomated3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`En tiempo real, automatizado`)
};

const fr_developerportal_onboarding_integrationmethod_realtimeautomated3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Realtimeautomated3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Temps réel, automatisé`)
};

const ar_developerportal_onboarding_integrationmethod_realtimeautomated3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Realtimeautomated3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`في الوقت الفعلي، آلي`)
};

/**
* | output |
* | --- |
* | "Real-time, automated" |
*
* @param {Developerportal_Onboarding_Integrationmethod_Realtimeautomated3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_integrationmethod_realtimeautomated3 = /** @type {((inputs?: Developerportal_Onboarding_Integrationmethod_Realtimeautomated3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Integrationmethod_Realtimeautomated3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_integrationmethod_realtimeautomated3(inputs)
	if (locale === "es") return es_developerportal_onboarding_integrationmethod_realtimeautomated3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_integrationmethod_realtimeautomated3(inputs)
	return ar_developerportal_onboarding_integrationmethod_realtimeautomated3(inputs)
});
export { developerportal_onboarding_integrationmethod_realtimeautomated3 as "developerPortal.onboarding.integrationMethod.realtimeAutomated" }