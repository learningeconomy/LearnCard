/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Branding_Displayname2Inputs */

const en_developerportal_onboarding_branding_displayname2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Displayname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Display Name`)
};

const es_developerportal_onboarding_branding_displayname2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Displayname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre para Mostrar`)
};

const fr_developerportal_onboarding_branding_displayname2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Displayname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom d'Affichage`)
};

const ar_developerportal_onboarding_branding_displayname2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Displayname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم العرض`)
};

/**
* | output |
* | --- |
* | "Display Name" |
*
* @param {Developerportal_Onboarding_Branding_Displayname2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_branding_displayname2 = /** @type {((inputs?: Developerportal_Onboarding_Branding_Displayname2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Branding_Displayname2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_branding_displayname2(inputs)
	if (locale === "es") return es_developerportal_onboarding_branding_displayname2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_branding_displayname2(inputs)
	return ar_developerportal_onboarding_branding_displayname2(inputs)
});
export { developerportal_onboarding_branding_displayname2 as "developerPortal.onboarding.branding.displayName" }