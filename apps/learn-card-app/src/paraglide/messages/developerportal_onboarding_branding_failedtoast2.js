/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Branding_Failedtoast2Inputs */

const en_developerportal_onboarding_branding_failedtoast2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Failedtoast2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to update profile`)
};

const es_developerportal_onboarding_branding_failedtoast2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Failedtoast2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al actualizar el perfil`)
};

const fr_developerportal_onboarding_branding_failedtoast2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Failedtoast2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la mise à jour du profil`)
};

const ar_developerportal_onboarding_branding_failedtoast2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Failedtoast2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل تحديث الملف الشخصي`)
};

/**
* | output |
* | --- |
* | "Failed to update profile" |
*
* @param {Developerportal_Onboarding_Branding_Failedtoast2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_branding_failedtoast2 = /** @type {((inputs?: Developerportal_Onboarding_Branding_Failedtoast2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Branding_Failedtoast2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_branding_failedtoast2(inputs)
	if (locale === "es") return es_developerportal_onboarding_branding_failedtoast2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_branding_failedtoast2(inputs)
	return ar_developerportal_onboarding_branding_failedtoast2(inputs)
});
export { developerportal_onboarding_branding_failedtoast2 as "developerPortal.onboarding.branding.failedToast" }