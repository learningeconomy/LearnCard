/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Projectsetup_Getcredentials3Inputs */

const en_developerportal_onboarding_projectsetup_getcredentials3 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Getcredentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Get Credentials`)
};

const es_developerportal_onboarding_projectsetup_getcredentials3 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Getcredentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtener Credenciales`)
};

const fr_developerportal_onboarding_projectsetup_getcredentials3 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Getcredentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtenir les Identifiants`)
};

const ar_developerportal_onboarding_projectsetup_getcredentials3 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Getcredentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الحصول على بيانات الاعتماد`)
};

/**
* | output |
* | --- |
* | "Get Credentials" |
*
* @param {Developerportal_Onboarding_Projectsetup_Getcredentials3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_projectsetup_getcredentials3 = /** @type {((inputs?: Developerportal_Onboarding_Projectsetup_Getcredentials3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Projectsetup_Getcredentials3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_projectsetup_getcredentials3(inputs)
	if (locale === "es") return es_developerportal_onboarding_projectsetup_getcredentials3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_projectsetup_getcredentials3(inputs)
	return ar_developerportal_onboarding_projectsetup_getcredentials3(inputs)
});
export { developerportal_onboarding_projectsetup_getcredentials3 as "developerPortal.onboarding.projectSetup.getCredentials" }