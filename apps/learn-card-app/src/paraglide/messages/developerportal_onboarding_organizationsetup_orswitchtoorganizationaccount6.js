/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Organizationsetup_Orswitchtoorganizationaccount6Inputs */

const en_developerportal_onboarding_organizationsetup_orswitchtoorganizationaccount6 = /** @type {(inputs: Developerportal_Onboarding_Organizationsetup_Orswitchtoorganizationaccount6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Or Switch to Organization Account`)
};

const es_developerportal_onboarding_organizationsetup_orswitchtoorganizationaccount6 = /** @type {(inputs: Developerportal_Onboarding_Organizationsetup_Orswitchtoorganizationaccount6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Or Switch to Organization Account`)
};

const fr_developerportal_onboarding_organizationsetup_orswitchtoorganizationaccount6 = /** @type {(inputs: Developerportal_Onboarding_Organizationsetup_Orswitchtoorganizationaccount6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Or Switch to Organization Account`)
};

const ar_developerportal_onboarding_organizationsetup_orswitchtoorganizationaccount6 = /** @type {(inputs: Developerportal_Onboarding_Organizationsetup_Orswitchtoorganizationaccount6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Or Switch to Organization Account`)
};

/**
* | output |
* | --- |
* | "Or Switch to Organization Account" |
*
* @param {Developerportal_Onboarding_Organizationsetup_Orswitchtoorganizationaccount6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_organizationsetup_orswitchtoorganizationaccount6 = /** @type {((inputs?: Developerportal_Onboarding_Organizationsetup_Orswitchtoorganizationaccount6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Organizationsetup_Orswitchtoorganizationaccount6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_organizationsetup_orswitchtoorganizationaccount6(inputs)
	if (locale === "es") return es_developerportal_onboarding_organizationsetup_orswitchtoorganizationaccount6(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_organizationsetup_orswitchtoorganizationaccount6(inputs)
	return ar_developerportal_onboarding_organizationsetup_orswitchtoorganizationaccount6(inputs)
});
export { developerportal_onboarding_organizationsetup_orswitchtoorganizationaccount6 as "developerPortal.onboarding.organizationSetup.orSwitchToOrganizationAccount" }