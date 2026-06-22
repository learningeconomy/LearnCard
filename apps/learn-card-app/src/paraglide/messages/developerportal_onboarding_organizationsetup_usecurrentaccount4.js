/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Organizationsetup_Usecurrentaccount4Inputs */

const en_developerportal_onboarding_organizationsetup_usecurrentaccount4 = /** @type {(inputs: Developerportal_Onboarding_Organizationsetup_Usecurrentaccount4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use Current Account`)
};

const es_developerportal_onboarding_organizationsetup_usecurrentaccount4 = /** @type {(inputs: Developerportal_Onboarding_Organizationsetup_Usecurrentaccount4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use Current Account`)
};

const fr_developerportal_onboarding_organizationsetup_usecurrentaccount4 = /** @type {(inputs: Developerportal_Onboarding_Organizationsetup_Usecurrentaccount4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use Current Account`)
};

const ar_developerportal_onboarding_organizationsetup_usecurrentaccount4 = /** @type {(inputs: Developerportal_Onboarding_Organizationsetup_Usecurrentaccount4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use Current Account`)
};

/**
* | output |
* | --- |
* | "Use Current Account" |
*
* @param {Developerportal_Onboarding_Organizationsetup_Usecurrentaccount4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_organizationsetup_usecurrentaccount4 = /** @type {((inputs?: Developerportal_Onboarding_Organizationsetup_Usecurrentaccount4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Organizationsetup_Usecurrentaccount4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_organizationsetup_usecurrentaccount4(inputs)
	if (locale === "es") return es_developerportal_onboarding_organizationsetup_usecurrentaccount4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_organizationsetup_usecurrentaccount4(inputs)
	return ar_developerportal_onboarding_organizationsetup_usecurrentaccount4(inputs)
});
export { developerportal_onboarding_organizationsetup_usecurrentaccount4 as "developerPortal.onboarding.organizationSetup.useCurrentAccount" }