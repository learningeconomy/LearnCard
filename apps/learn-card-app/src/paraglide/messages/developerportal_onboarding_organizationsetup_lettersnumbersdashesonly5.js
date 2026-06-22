/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Organizationsetup_Lettersnumbersdashesonly5Inputs */

const en_developerportal_onboarding_organizationsetup_lettersnumbersdashesonly5 = /** @type {(inputs: Developerportal_Onboarding_Organizationsetup_Lettersnumbersdashesonly5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Letters, numbers, dashes only`)
};

const es_developerportal_onboarding_organizationsetup_lettersnumbersdashesonly5 = /** @type {(inputs: Developerportal_Onboarding_Organizationsetup_Lettersnumbersdashesonly5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Letters, numbers, dashes only`)
};

const fr_developerportal_onboarding_organizationsetup_lettersnumbersdashesonly5 = /** @type {(inputs: Developerportal_Onboarding_Organizationsetup_Lettersnumbersdashesonly5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Letters, numbers, dashes only`)
};

const ar_developerportal_onboarding_organizationsetup_lettersnumbersdashesonly5 = /** @type {(inputs: Developerportal_Onboarding_Organizationsetup_Lettersnumbersdashesonly5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Letters, numbers, dashes only`)
};

/**
* | output |
* | --- |
* | "Letters, numbers, dashes only" |
*
* @param {Developerportal_Onboarding_Organizationsetup_Lettersnumbersdashesonly5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_organizationsetup_lettersnumbersdashesonly5 = /** @type {((inputs?: Developerportal_Onboarding_Organizationsetup_Lettersnumbersdashesonly5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Organizationsetup_Lettersnumbersdashesonly5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_organizationsetup_lettersnumbersdashesonly5(inputs)
	if (locale === "es") return es_developerportal_onboarding_organizationsetup_lettersnumbersdashesonly5(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_organizationsetup_lettersnumbersdashesonly5(inputs)
	return ar_developerportal_onboarding_organizationsetup_lettersnumbersdashesonly5(inputs)
});
export { developerportal_onboarding_organizationsetup_lettersnumbersdashesonly5 as "developerPortal.onboarding.organizationSetup.lettersNumbersDashesOnly" }