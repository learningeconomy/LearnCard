/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Verifyyourcodeworked5Inputs */

const en_developerportal_onboarding_datamapping_verifyyourcodeworked5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Verifyyourcodeworked5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verify Your Code Worked`)
};

const es_developerportal_onboarding_datamapping_verifyyourcodeworked5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Verifyyourcodeworked5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verify Your Code Worked`)
};

const fr_developerportal_onboarding_datamapping_verifyyourcodeworked5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Verifyyourcodeworked5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verify Your Code Worked`)
};

const ar_developerportal_onboarding_datamapping_verifyyourcodeworked5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Verifyyourcodeworked5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verify Your Code Worked`)
};

/**
* | output |
* | --- |
* | "Verify Your Code Worked" |
*
* @param {Developerportal_Onboarding_Datamapping_Verifyyourcodeworked5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_verifyyourcodeworked5 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Verifyyourcodeworked5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Verifyyourcodeworked5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_verifyyourcodeworked5(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_verifyyourcodeworked5(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_verifyyourcodeworked5(inputs)
	return ar_developerportal_onboarding_datamapping_verifyyourcodeworked5(inputs)
});
export { developerportal_onboarding_datamapping_verifyyourcodeworked5 as "developerPortal.onboarding.dataMapping.verifyYourCodeWorked" }