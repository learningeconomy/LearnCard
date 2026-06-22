/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Branding_Profileinfo2Inputs */

const en_developerportal_onboarding_branding_profileinfo2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Profileinfo2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Profile Information`)
};

const es_developerportal_onboarding_branding_profileinfo2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Profileinfo2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Información del Perfil`)
};

const fr_developerportal_onboarding_branding_profileinfo2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Profileinfo2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Informations du Profil`)
};

const ar_developerportal_onboarding_branding_profileinfo2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Profileinfo2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معلومات الملف الشخصي`)
};

/**
* | output |
* | --- |
* | "Profile Information" |
*
* @param {Developerportal_Onboarding_Branding_Profileinfo2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_branding_profileinfo2 = /** @type {((inputs?: Developerportal_Onboarding_Branding_Profileinfo2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Branding_Profileinfo2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_branding_profileinfo2(inputs)
	if (locale === "es") return es_developerportal_onboarding_branding_profileinfo2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_branding_profileinfo2(inputs)
	return ar_developerportal_onboarding_branding_profileinfo2(inputs)
});
export { developerportal_onboarding_branding_profileinfo2 as "developerPortal.onboarding.branding.profileInfo" }