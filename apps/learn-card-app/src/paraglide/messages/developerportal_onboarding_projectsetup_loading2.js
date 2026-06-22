/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Projectsetup_Loading2Inputs */

const en_developerportal_onboarding_projectsetup_loading2 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Loading2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading...`)
};

const es_developerportal_onboarding_projectsetup_loading2 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Loading2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando...`)
};

const fr_developerportal_onboarding_projectsetup_loading2 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Loading2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement...`)
};

const ar_developerportal_onboarding_projectsetup_loading2 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Loading2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري التحميل...`)
};

/**
* | output |
* | --- |
* | "Loading..." |
*
* @param {Developerportal_Onboarding_Projectsetup_Loading2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_projectsetup_loading2 = /** @type {((inputs?: Developerportal_Onboarding_Projectsetup_Loading2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Projectsetup_Loading2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_projectsetup_loading2(inputs)
	if (locale === "es") return es_developerportal_onboarding_projectsetup_loading2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_projectsetup_loading2(inputs)
	return ar_developerportal_onboarding_projectsetup_loading2(inputs)
});
export { developerportal_onboarding_projectsetup_loading2 as "developerPortal.onboarding.projectSetup.loading" }