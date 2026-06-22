/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Projectsetup_Storesecurely3Inputs */

const en_developerportal_onboarding_projectsetup_storesecurely3 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Storesecurely3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Store securely. Never commit to code.`)
};

const es_developerportal_onboarding_projectsetup_storesecurely3 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Storesecurely3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guárdalo de forma segura. Nunca lo subas al código.`)
};

const fr_developerportal_onboarding_projectsetup_storesecurely3 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Storesecurely3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conservez-la en sécurité. Ne la commettez jamais dans le code.`)
};

const ar_developerportal_onboarding_projectsetup_storesecurely3 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Storesecurely3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`احتفظ به بأمان. لا تقم بإضافته إلى الكود مطلقاً.`)
};

/**
* | output |
* | --- |
* | "Store securely. Never commit to code." |
*
* @param {Developerportal_Onboarding_Projectsetup_Storesecurely3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_projectsetup_storesecurely3 = /** @type {((inputs?: Developerportal_Onboarding_Projectsetup_Storesecurely3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Projectsetup_Storesecurely3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_projectsetup_storesecurely3(inputs)
	if (locale === "es") return es_developerportal_onboarding_projectsetup_storesecurely3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_projectsetup_storesecurely3(inputs)
	return ar_developerportal_onboarding_projectsetup_storesecurely3(inputs)
});
export { developerportal_onboarding_projectsetup_storesecurely3 as "developerPortal.onboarding.projectSetup.storeSecurely" }