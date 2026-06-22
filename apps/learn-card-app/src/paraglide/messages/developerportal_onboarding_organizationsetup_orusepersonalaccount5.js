/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Organizationsetup_Orusepersonalaccount5Inputs */

const en_developerportal_onboarding_organizationsetup_orusepersonalaccount5 = /** @type {(inputs: Developerportal_Onboarding_Organizationsetup_Orusepersonalaccount5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Or Use Personal Account`)
};

const es_developerportal_onboarding_organizationsetup_orusepersonalaccount5 = /** @type {(inputs: Developerportal_Onboarding_Organizationsetup_Orusepersonalaccount5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Or Use Personal Account`)
};

const fr_developerportal_onboarding_organizationsetup_orusepersonalaccount5 = /** @type {(inputs: Developerportal_Onboarding_Organizationsetup_Orusepersonalaccount5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Or Use Personal Account`)
};

const ar_developerportal_onboarding_organizationsetup_orusepersonalaccount5 = /** @type {(inputs: Developerportal_Onboarding_Organizationsetup_Orusepersonalaccount5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Or Use Personal Account`)
};

/**
* | output |
* | --- |
* | "Or Use Personal Account" |
*
* @param {Developerportal_Onboarding_Organizationsetup_Orusepersonalaccount5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_organizationsetup_orusepersonalaccount5 = /** @type {((inputs?: Developerportal_Onboarding_Organizationsetup_Orusepersonalaccount5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Organizationsetup_Orusepersonalaccount5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_organizationsetup_orusepersonalaccount5(inputs)
	if (locale === "es") return es_developerportal_onboarding_organizationsetup_orusepersonalaccount5(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_organizationsetup_orusepersonalaccount5(inputs)
	return ar_developerportal_onboarding_organizationsetup_orusepersonalaccount5(inputs)
});
export { developerportal_onboarding_organizationsetup_orusepersonalaccount5 as "developerPortal.onboarding.organizationSetup.orUsePersonalAccount" }