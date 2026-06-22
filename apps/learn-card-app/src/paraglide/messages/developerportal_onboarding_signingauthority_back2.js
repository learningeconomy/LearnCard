/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Signingauthority_Back2Inputs */

const en_developerportal_onboarding_signingauthority_back2 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Back2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Back`)
};

const es_developerportal_onboarding_signingauthority_back2 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Back2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Atrás`)
};

const fr_developerportal_onboarding_signingauthority_back2 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Back2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retour`)
};

const ar_developerportal_onboarding_signingauthority_back2 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Back2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رجوع`)
};

/**
* | output |
* | --- |
* | "Back" |
*
* @param {Developerportal_Onboarding_Signingauthority_Back2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_signingauthority_back2 = /** @type {((inputs?: Developerportal_Onboarding_Signingauthority_Back2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Signingauthority_Back2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_signingauthority_back2(inputs)
	if (locale === "es") return es_developerportal_onboarding_signingauthority_back2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_signingauthority_back2(inputs)
	return ar_developerportal_onboarding_signingauthority_back2(inputs)
});
export { developerportal_onboarding_signingauthority_back2 as "developerPortal.onboarding.signingAuthority.back" }