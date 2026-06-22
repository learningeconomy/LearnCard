/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Branding_Cardbginput3Inputs */

const en_developerportal_onboarding_branding_cardbginput3 = /** @type {(inputs: Developerportal_Onboarding_Branding_Cardbginput3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Card Background`)
};

const es_developerportal_onboarding_branding_cardbginput3 = /** @type {(inputs: Developerportal_Onboarding_Branding_Cardbginput3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fondo de Tarjeta`)
};

const fr_developerportal_onboarding_branding_cardbginput3 = /** @type {(inputs: Developerportal_Onboarding_Branding_Cardbginput3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Arrière-plan de la Carte`)
};

const ar_developerportal_onboarding_branding_cardbginput3 = /** @type {(inputs: Developerportal_Onboarding_Branding_Cardbginput3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خلفية البطاقة`)
};

/**
* | output |
* | --- |
* | "Card Background" |
*
* @param {Developerportal_Onboarding_Branding_Cardbginput3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_branding_cardbginput3 = /** @type {((inputs?: Developerportal_Onboarding_Branding_Cardbginput3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Branding_Cardbginput3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_branding_cardbginput3(inputs)
	if (locale === "es") return es_developerportal_onboarding_branding_cardbginput3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_branding_cardbginput3(inputs)
	return ar_developerportal_onboarding_branding_cardbginput3(inputs)
});
export { developerportal_onboarding_branding_cardbginput3 as "developerPortal.onboarding.branding.cardBgInput" }