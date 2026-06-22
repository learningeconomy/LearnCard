/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Developerportal_Onboarding_Signingauthority_Using2Inputs */

const en_developerportal_onboarding_signingauthority_using2 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Using2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Using: ${i?.name}`)
};

const es_developerportal_onboarding_signingauthority_using2 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Using2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Usando: ${i?.name}`)
};

const fr_developerportal_onboarding_signingauthority_using2 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Using2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Utilisation : ${i?.name}`)
};

const ar_developerportal_onboarding_signingauthority_using2 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Using2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`الاستخدام: ${i?.name}`)
};

/**
* | output |
* | --- |
* | "Using: {name}" |
*
* @param {Developerportal_Onboarding_Signingauthority_Using2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_signingauthority_using2 = /** @type {((inputs: Developerportal_Onboarding_Signingauthority_Using2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Signingauthority_Using2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_signingauthority_using2(inputs)
	if (locale === "es") return es_developerportal_onboarding_signingauthority_using2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_signingauthority_using2(inputs)
	return ar_developerportal_onboarding_signingauthority_using2(inputs)
});
export { developerportal_onboarding_signingauthority_using2 as "developerPortal.onboarding.signingAuthority.using" }