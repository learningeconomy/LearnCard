/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Branding_Upload1Inputs */

const en_developerportal_onboarding_branding_upload1 = /** @type {(inputs: Developerportal_Onboarding_Branding_Upload1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Upload`)
};

const es_developerportal_onboarding_branding_upload1 = /** @type {(inputs: Developerportal_Onboarding_Branding_Upload1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Subir`)
};

const fr_developerportal_onboarding_branding_upload1 = /** @type {(inputs: Developerportal_Onboarding_Branding_Upload1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Télécharger`)
};

const ar_developerportal_onboarding_branding_upload1 = /** @type {(inputs: Developerportal_Onboarding_Branding_Upload1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رفع`)
};

/**
* | output |
* | --- |
* | "Upload" |
*
* @param {Developerportal_Onboarding_Branding_Upload1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_branding_upload1 = /** @type {((inputs?: Developerportal_Onboarding_Branding_Upload1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Branding_Upload1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_branding_upload1(inputs)
	if (locale === "es") return es_developerportal_onboarding_branding_upload1(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_branding_upload1(inputs)
	return ar_developerportal_onboarding_branding_upload1(inputs)
});
export { developerportal_onboarding_branding_upload1 as "developerPortal.onboarding.branding.upload" }