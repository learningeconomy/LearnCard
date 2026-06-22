/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Signingauthority_Failedtoast3Inputs */

const en_developerportal_onboarding_signingauthority_failedtoast3 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Failedtoast3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to create signing authority`)
};

const es_developerportal_onboarding_signingauthority_failedtoast3 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Failedtoast3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al crear la autoridad de firma`)
};

const fr_developerportal_onboarding_signingauthority_failedtoast3 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Failedtoast3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la création de l'autorité de signature`)
};

const ar_developerportal_onboarding_signingauthority_failedtoast3 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Failedtoast3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل إنشاء سلطة التوقيع`)
};

/**
* | output |
* | --- |
* | "Failed to create signing authority" |
*
* @param {Developerportal_Onboarding_Signingauthority_Failedtoast3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_signingauthority_failedtoast3 = /** @type {((inputs?: Developerportal_Onboarding_Signingauthority_Failedtoast3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Signingauthority_Failedtoast3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_signingauthority_failedtoast3(inputs)
	if (locale === "es") return es_developerportal_onboarding_signingauthority_failedtoast3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_signingauthority_failedtoast3(inputs)
	return ar_developerportal_onboarding_signingauthority_failedtoast3(inputs)
});
export { developerportal_onboarding_signingauthority_failedtoast3 as "developerPortal.onboarding.signingAuthority.failedToast" }