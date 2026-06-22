/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Autoinjected3Inputs */

const en_developerportal_onboarding_templatebuilder_autoinjected3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Autoinjected3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Auto-injected:`)
};

const es_developerportal_onboarding_templatebuilder_autoinjected3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Autoinjected3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inyectado automáticamente:`)
};

const fr_developerportal_onboarding_templatebuilder_autoinjected3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Autoinjected3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Injecté automatiquement :`)
};

const ar_developerportal_onboarding_templatebuilder_autoinjected3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Autoinjected3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`محقون تلقائياً:`)
};

/**
* | output |
* | --- |
* | "Auto-injected:" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Autoinjected3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_autoinjected3 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Autoinjected3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Autoinjected3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_autoinjected3(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_autoinjected3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_autoinjected3(inputs)
	return ar_developerportal_onboarding_templatebuilder_autoinjected3(inputs)
});
export { developerportal_onboarding_templatebuilder_autoinjected3 as "developerPortal.onboarding.templateBuilder.autoInjected" }