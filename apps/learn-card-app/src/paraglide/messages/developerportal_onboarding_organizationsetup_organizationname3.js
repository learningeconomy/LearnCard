/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Organizationsetup_Organizationname3Inputs */

const en_developerportal_onboarding_organizationsetup_organizationname3 = /** @type {(inputs: Developerportal_Onboarding_Organizationsetup_Organizationname3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Organization Name`)
};

const es_developerportal_onboarding_organizationsetup_organizationname3 = /** @type {(inputs: Developerportal_Onboarding_Organizationsetup_Organizationname3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Organization Name`)
};

const fr_developerportal_onboarding_organizationsetup_organizationname3 = /** @type {(inputs: Developerportal_Onboarding_Organizationsetup_Organizationname3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Organization Name`)
};

const ar_developerportal_onboarding_organizationsetup_organizationname3 = /** @type {(inputs: Developerportal_Onboarding_Organizationsetup_Organizationname3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Organization Name`)
};

/**
* | output |
* | --- |
* | "Organization Name" |
*
* @param {Developerportal_Onboarding_Organizationsetup_Organizationname3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_organizationsetup_organizationname3 = /** @type {((inputs?: Developerportal_Onboarding_Organizationsetup_Organizationname3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Organizationsetup_Organizationname3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_organizationsetup_organizationname3(inputs)
	if (locale === "es") return es_developerportal_onboarding_organizationsetup_organizationname3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_organizationsetup_organizationname3(inputs)
	return ar_developerportal_onboarding_organizationsetup_organizationname3(inputs)
});
export { developerportal_onboarding_organizationsetup_organizationname3 as "developerPortal.onboarding.organizationSetup.organizationName" }