/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Projectsetup_Projectnameplaceholder4Inputs */

const en_developerportal_onboarding_projectsetup_projectnameplaceholder4 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Projectnameplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`e.g., AARP Skills Builder`)
};

const es_developerportal_onboarding_projectsetup_projectnameplaceholder4 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Projectnameplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ej., AARP Skills Builder`)
};

const fr_developerportal_onboarding_projectsetup_projectnameplaceholder4 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Projectnameplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ex., AARP Skills Builder`)
};

const ar_developerportal_onboarding_projectsetup_projectnameplaceholder4 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Projectnameplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مثال: AARP Skills Builder`)
};

/**
* | output |
* | --- |
* | "e.g., AARP Skills Builder" |
*
* @param {Developerportal_Onboarding_Projectsetup_Projectnameplaceholder4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_projectsetup_projectnameplaceholder4 = /** @type {((inputs?: Developerportal_Onboarding_Projectsetup_Projectnameplaceholder4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Projectsetup_Projectnameplaceholder4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_projectsetup_projectnameplaceholder4(inputs)
	if (locale === "es") return es_developerportal_onboarding_projectsetup_projectnameplaceholder4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_projectsetup_projectnameplaceholder4(inputs)
	return ar_developerportal_onboarding_projectsetup_projectnameplaceholder4(inputs)
});
export { developerportal_onboarding_projectsetup_projectnameplaceholder4 as "developerPortal.onboarding.projectSetup.projectNamePlaceholder" }