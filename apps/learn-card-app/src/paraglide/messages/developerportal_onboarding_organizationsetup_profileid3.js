/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Organizationsetup_Profileid3Inputs */

const en_developerportal_onboarding_organizationsetup_profileid3 = /** @type {(inputs: Developerportal_Onboarding_Organizationsetup_Profileid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Profile ID`)
};

const es_developerportal_onboarding_organizationsetup_profileid3 = /** @type {(inputs: Developerportal_Onboarding_Organizationsetup_Profileid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Profile ID`)
};

const fr_developerportal_onboarding_organizationsetup_profileid3 = /** @type {(inputs: Developerportal_Onboarding_Organizationsetup_Profileid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Profile ID`)
};

const ar_developerportal_onboarding_organizationsetup_profileid3 = /** @type {(inputs: Developerportal_Onboarding_Organizationsetup_Profileid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Profile ID`)
};

/**
* | output |
* | --- |
* | "Profile ID" |
*
* @param {Developerportal_Onboarding_Organizationsetup_Profileid3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_organizationsetup_profileid3 = /** @type {((inputs?: Developerportal_Onboarding_Organizationsetup_Profileid3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Organizationsetup_Profileid3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_organizationsetup_profileid3(inputs)
	if (locale === "es") return es_developerportal_onboarding_organizationsetup_profileid3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_organizationsetup_profileid3(inputs)
	return ar_developerportal_onboarding_organizationsetup_profileid3(inputs)
});
export { developerportal_onboarding_organizationsetup_profileid3 as "developerPortal.onboarding.organizationSetup.profileId" }