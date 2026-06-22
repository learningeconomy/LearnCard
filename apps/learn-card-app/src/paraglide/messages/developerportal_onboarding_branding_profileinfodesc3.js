/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Branding_Profileinfodesc3Inputs */

const en_developerportal_onboarding_branding_profileinfodesc3 = /** @type {(inputs: Developerportal_Onboarding_Branding_Profileinfodesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`How your organization appears to others`)
};

const es_developerportal_onboarding_branding_profileinfodesc3 = /** @type {(inputs: Developerportal_Onboarding_Branding_Profileinfodesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cómo aparece tu organización ante los demás`)
};

const fr_developerportal_onboarding_branding_profileinfodesc3 = /** @type {(inputs: Developerportal_Onboarding_Branding_Profileinfodesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Comment votre organisation apparaît aux autres`)
};

const ar_developerportal_onboarding_branding_profileinfodesc3 = /** @type {(inputs: Developerportal_Onboarding_Branding_Profileinfodesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`كيف تظهر مؤسستك للآخرين`)
};

/**
* | output |
* | --- |
* | "How your organization appears to others" |
*
* @param {Developerportal_Onboarding_Branding_Profileinfodesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_branding_profileinfodesc3 = /** @type {((inputs?: Developerportal_Onboarding_Branding_Profileinfodesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Branding_Profileinfodesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_branding_profileinfodesc3(inputs)
	if (locale === "es") return es_developerportal_onboarding_branding_profileinfodesc3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_branding_profileinfodesc3(inputs)
	return ar_developerportal_onboarding_branding_profileinfodesc3(inputs)
});
export { developerportal_onboarding_branding_profileinfodesc3 as "developerPortal.onboarding.branding.profileInfoDesc" }