/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Projectsetup_Creatingapikey4Inputs */

const en_developerportal_onboarding_projectsetup_creatingapikey4 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Creatingapikey4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creating API key...`)
};

const es_developerportal_onboarding_projectsetup_creatingapikey4 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Creatingapikey4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creando clave API...`)
};

const fr_developerportal_onboarding_projectsetup_creatingapikey4 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Creatingapikey4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Création de la clé API...`)
};

const ar_developerportal_onboarding_projectsetup_creatingapikey4 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Creatingapikey4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري إنشاء مفتاح API...`)
};

/**
* | output |
* | --- |
* | "Creating API key..." |
*
* @param {Developerportal_Onboarding_Projectsetup_Creatingapikey4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_projectsetup_creatingapikey4 = /** @type {((inputs?: Developerportal_Onboarding_Projectsetup_Creatingapikey4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Projectsetup_Creatingapikey4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_projectsetup_creatingapikey4(inputs)
	if (locale === "es") return es_developerportal_onboarding_projectsetup_creatingapikey4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_projectsetup_creatingapikey4(inputs)
	return ar_developerportal_onboarding_projectsetup_creatingapikey4(inputs)
});
export { developerportal_onboarding_projectsetup_creatingapikey4 as "developerPortal.onboarding.projectSetup.creatingApiKey" }