/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Integrationmethod_Fullcontrol3Inputs */

const en_developerportal_onboarding_integrationmethod_fullcontrol3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Fullcontrol3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Full control`)
};

const es_developerportal_onboarding_integrationmethod_fullcontrol3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Fullcontrol3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Control total`)
};

const fr_developerportal_onboarding_integrationmethod_fullcontrol3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Fullcontrol3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contrôle total`)
};

const ar_developerportal_onboarding_integrationmethod_fullcontrol3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Fullcontrol3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحكم كامل`)
};

/**
* | output |
* | --- |
* | "Full control" |
*
* @param {Developerportal_Onboarding_Integrationmethod_Fullcontrol3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_integrationmethod_fullcontrol3 = /** @type {((inputs?: Developerportal_Onboarding_Integrationmethod_Fullcontrol3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Integrationmethod_Fullcontrol3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_integrationmethod_fullcontrol3(inputs)
	if (locale === "es") return es_developerportal_onboarding_integrationmethod_fullcontrol3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_integrationmethod_fullcontrol3(inputs)
	return ar_developerportal_onboarding_integrationmethod_fullcontrol3(inputs)
});
export { developerportal_onboarding_integrationmethod_fullcontrol3 as "developerPortal.onboarding.integrationMethod.fullControl" }