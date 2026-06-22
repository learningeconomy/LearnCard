/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Organizationsetup_Logopreview3Inputs */

const en_developerportal_onboarding_organizationsetup_logopreview3 = /** @type {(inputs: Developerportal_Onboarding_Organizationsetup_Logopreview3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Logo preview`)
};

const es_developerportal_onboarding_organizationsetup_logopreview3 = /** @type {(inputs: Developerportal_Onboarding_Organizationsetup_Logopreview3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Logo preview`)
};

const fr_developerportal_onboarding_organizationsetup_logopreview3 = /** @type {(inputs: Developerportal_Onboarding_Organizationsetup_Logopreview3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Logo preview`)
};

const ar_developerportal_onboarding_organizationsetup_logopreview3 = /** @type {(inputs: Developerportal_Onboarding_Organizationsetup_Logopreview3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Logo preview`)
};

/**
* | output |
* | --- |
* | "Logo preview" |
*
* @param {Developerportal_Onboarding_Organizationsetup_Logopreview3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_organizationsetup_logopreview3 = /** @type {((inputs?: Developerportal_Onboarding_Organizationsetup_Logopreview3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Organizationsetup_Logopreview3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_organizationsetup_logopreview3(inputs)
	if (locale === "es") return es_developerportal_onboarding_organizationsetup_logopreview3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_organizationsetup_logopreview3(inputs)
	return ar_developerportal_onboarding_organizationsetup_logopreview3(inputs)
});
export { developerportal_onboarding_organizationsetup_logopreview3 as "developerPortal.onboarding.organizationSetup.logoPreview" }