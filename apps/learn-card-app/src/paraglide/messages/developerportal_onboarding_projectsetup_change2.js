/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Projectsetup_Change2Inputs */

const en_developerportal_onboarding_projectsetup_change2 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Change2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Change`)
};

const es_developerportal_onboarding_projectsetup_change2 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Change2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cambiar`)
};

const fr_developerportal_onboarding_projectsetup_change2 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Change2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier`)
};

const ar_developerportal_onboarding_projectsetup_change2 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Change2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تغيير`)
};

/**
* | output |
* | --- |
* | "Change" |
*
* @param {Developerportal_Onboarding_Projectsetup_Change2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_projectsetup_change2 = /** @type {((inputs?: Developerportal_Onboarding_Projectsetup_Change2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Projectsetup_Change2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_projectsetup_change2(inputs)
	if (locale === "es") return es_developerportal_onboarding_projectsetup_change2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_projectsetup_change2(inputs)
	return ar_developerportal_onboarding_projectsetup_change2(inputs)
});
export { developerportal_onboarding_projectsetup_change2 as "developerPortal.onboarding.projectSetup.change" }