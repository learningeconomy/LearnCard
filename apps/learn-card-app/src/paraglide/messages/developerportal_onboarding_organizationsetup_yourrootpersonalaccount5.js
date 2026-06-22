/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Organizationsetup_Yourrootpersonalaccount5Inputs */

const en_developerportal_onboarding_organizationsetup_yourrootpersonalaccount5 = /** @type {(inputs: Developerportal_Onboarding_Organizationsetup_Yourrootpersonalaccount5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your root personal account`)
};

const es_developerportal_onboarding_organizationsetup_yourrootpersonalaccount5 = /** @type {(inputs: Developerportal_Onboarding_Organizationsetup_Yourrootpersonalaccount5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your root personal account`)
};

const fr_developerportal_onboarding_organizationsetup_yourrootpersonalaccount5 = /** @type {(inputs: Developerportal_Onboarding_Organizationsetup_Yourrootpersonalaccount5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your root personal account`)
};

const ar_developerportal_onboarding_organizationsetup_yourrootpersonalaccount5 = /** @type {(inputs: Developerportal_Onboarding_Organizationsetup_Yourrootpersonalaccount5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your root personal account`)
};

/**
* | output |
* | --- |
* | "Your root personal account" |
*
* @param {Developerportal_Onboarding_Organizationsetup_Yourrootpersonalaccount5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_organizationsetup_yourrootpersonalaccount5 = /** @type {((inputs?: Developerportal_Onboarding_Organizationsetup_Yourrootpersonalaccount5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Organizationsetup_Yourrootpersonalaccount5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_organizationsetup_yourrootpersonalaccount5(inputs)
	if (locale === "es") return es_developerportal_onboarding_organizationsetup_yourrootpersonalaccount5(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_organizationsetup_yourrootpersonalaccount5(inputs)
	return ar_developerportal_onboarding_organizationsetup_yourrootpersonalaccount5(inputs)
});
export { developerportal_onboarding_organizationsetup_yourrootpersonalaccount5 as "developerPortal.onboarding.organizationSetup.yourRootPersonalAccount" }