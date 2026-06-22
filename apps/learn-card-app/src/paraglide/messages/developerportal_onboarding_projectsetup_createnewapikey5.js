/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Projectsetup_Createnewapikey5Inputs */

const en_developerportal_onboarding_projectsetup_createnewapikey5 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Createnewapikey5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create New API Key`)
};

const es_developerportal_onboarding_projectsetup_createnewapikey5 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Createnewapikey5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear Nueva Clave API`)
};

const fr_developerportal_onboarding_projectsetup_createnewapikey5 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Createnewapikey5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer une Nouvelle Clé API`)
};

const ar_developerportal_onboarding_projectsetup_createnewapikey5 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Createnewapikey5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء مفتاح API جديد`)
};

/**
* | output |
* | --- |
* | "Create New API Key" |
*
* @param {Developerportal_Onboarding_Projectsetup_Createnewapikey5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_projectsetup_createnewapikey5 = /** @type {((inputs?: Developerportal_Onboarding_Projectsetup_Createnewapikey5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Projectsetup_Createnewapikey5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_projectsetup_createnewapikey5(inputs)
	if (locale === "es") return es_developerportal_onboarding_projectsetup_createnewapikey5(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_projectsetup_createnewapikey5(inputs)
	return ar_developerportal_onboarding_projectsetup_createnewapikey5(inputs)
});
export { developerportal_onboarding_projectsetup_createnewapikey5 as "developerPortal.onboarding.projectSetup.createNewApiKey" }