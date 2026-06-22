/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Projectsetup_Createnewproject4Inputs */

const en_developerportal_onboarding_projectsetup_createnewproject4 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Createnewproject4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create New Project`)
};

const es_developerportal_onboarding_projectsetup_createnewproject4 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Createnewproject4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear Nuevo Proyecto`)
};

const fr_developerportal_onboarding_projectsetup_createnewproject4 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Createnewproject4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer un Nouveau Projet`)
};

const ar_developerportal_onboarding_projectsetup_createnewproject4 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Createnewproject4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء مشروع جديد`)
};

/**
* | output |
* | --- |
* | "Create New Project" |
*
* @param {Developerportal_Onboarding_Projectsetup_Createnewproject4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_projectsetup_createnewproject4 = /** @type {((inputs?: Developerportal_Onboarding_Projectsetup_Createnewproject4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Projectsetup_Createnewproject4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_projectsetup_createnewproject4(inputs)
	if (locale === "es") return es_developerportal_onboarding_projectsetup_createnewproject4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_projectsetup_createnewproject4(inputs)
	return ar_developerportal_onboarding_projectsetup_createnewproject4(inputs)
});
export { developerportal_onboarding_projectsetup_createnewproject4 as "developerPortal.onboarding.projectSetup.createNewProject" }