/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Branding_Imagerecommendation2Inputs */

const en_developerportal_onboarding_branding_imagerecommendation2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Imagerecommendation2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recommended: Square image, at least 256x256px`)
};

const es_developerportal_onboarding_branding_imagerecommendation2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Imagerecommendation2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recomendado: Imagen cuadrada, al menos 256x256px`)
};

const fr_developerportal_onboarding_branding_imagerecommendation2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Imagerecommendation2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recommandé : Image carrée, au moins 256x256px`)
};

const ar_developerportal_onboarding_branding_imagerecommendation2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Imagerecommendation2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`موصى به: صورة مربعة، 256×256 بكسل على الأقل`)
};

/**
* | output |
* | --- |
* | "Recommended: Square image, at least 256x256px" |
*
* @param {Developerportal_Onboarding_Branding_Imagerecommendation2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_branding_imagerecommendation2 = /** @type {((inputs?: Developerportal_Onboarding_Branding_Imagerecommendation2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Branding_Imagerecommendation2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_branding_imagerecommendation2(inputs)
	if (locale === "es") return es_developerportal_onboarding_branding_imagerecommendation2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_branding_imagerecommendation2(inputs)
	return ar_developerportal_onboarding_branding_imagerecommendation2(inputs)
});
export { developerportal_onboarding_branding_imagerecommendation2 as "developerPortal.onboarding.branding.imageRecommendation" }