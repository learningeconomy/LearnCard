/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Projectsetup_Loadingprojects3Inputs */

const en_developerportal_onboarding_projectsetup_loadingprojects3 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Loadingprojects3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading projects...`)
};

const es_developerportal_onboarding_projectsetup_loadingprojects3 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Loadingprojects3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando proyectos...`)
};

const fr_developerportal_onboarding_projectsetup_loadingprojects3 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Loadingprojects3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement des projets...`)
};

const ar_developerportal_onboarding_projectsetup_loadingprojects3 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Loadingprojects3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري تحميل المشاريع...`)
};

/**
* | output |
* | --- |
* | "Loading projects..." |
*
* @param {Developerportal_Onboarding_Projectsetup_Loadingprojects3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_projectsetup_loadingprojects3 = /** @type {((inputs?: Developerportal_Onboarding_Projectsetup_Loadingprojects3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Projectsetup_Loadingprojects3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_projectsetup_loadingprojects3(inputs)
	if (locale === "es") return es_developerportal_onboarding_projectsetup_loadingprojects3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_projectsetup_loadingprojects3(inputs)
	return ar_developerportal_onboarding_projectsetup_loadingprojects3(inputs)
});
export { developerportal_onboarding_projectsetup_loadingprojects3 as "developerPortal.onboarding.projectSetup.loadingProjects" }