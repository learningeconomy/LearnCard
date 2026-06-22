/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Projectsetup_Backtoexisting4Inputs */

const en_developerportal_onboarding_projectsetup_backtoexisting4 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Backtoexisting4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Back to existing projects`)
};

const es_developerportal_onboarding_projectsetup_backtoexisting4 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Backtoexisting4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Volver a proyectos existentes`)
};

const fr_developerportal_onboarding_projectsetup_backtoexisting4 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Backtoexisting4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retour aux projets existants`)
};

const ar_developerportal_onboarding_projectsetup_backtoexisting4 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Backtoexisting4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العودة إلى المشاريع الموجودة`)
};

/**
* | output |
* | --- |
* | "Back to existing projects" |
*
* @param {Developerportal_Onboarding_Projectsetup_Backtoexisting4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_projectsetup_backtoexisting4 = /** @type {((inputs?: Developerportal_Onboarding_Projectsetup_Backtoexisting4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Projectsetup_Backtoexisting4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_projectsetup_backtoexisting4(inputs)
	if (locale === "es") return es_developerportal_onboarding_projectsetup_backtoexisting4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_projectsetup_backtoexisting4(inputs)
	return ar_developerportal_onboarding_projectsetup_backtoexisting4(inputs)
});
export { developerportal_onboarding_projectsetup_backtoexisting4 as "developerPortal.onboarding.projectSetup.backToExisting" }