/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Branding_Cardcolors2Inputs */

const en_developerportal_onboarding_branding_cardcolors2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Cardcolors2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Card Colors`)
};

const es_developerportal_onboarding_branding_cardcolors2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Cardcolors2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Colores de la Tarjeta`)
};

const fr_developerportal_onboarding_branding_cardcolors2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Cardcolors2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Couleurs de la Carte`)
};

const ar_developerportal_onboarding_branding_cardcolors2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Cardcolors2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ألوان البطاقة`)
};

/**
* | output |
* | --- |
* | "Card Colors" |
*
* @param {Developerportal_Onboarding_Branding_Cardcolors2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_branding_cardcolors2 = /** @type {((inputs?: Developerportal_Onboarding_Branding_Cardcolors2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Branding_Cardcolors2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_branding_cardcolors2(inputs)
	if (locale === "es") return es_developerportal_onboarding_branding_cardcolors2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_branding_cardcolors2(inputs)
	return ar_developerportal_onboarding_branding_cardcolors2(inputs)
});
export { developerportal_onboarding_branding_cardcolors2 as "developerPortal.onboarding.branding.cardColors" }