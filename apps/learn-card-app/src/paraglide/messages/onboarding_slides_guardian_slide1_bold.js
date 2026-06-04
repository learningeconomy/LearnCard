/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Slides_Guardian_Slide1_BoldInputs */

const en_onboarding_slides_guardian_slide1_bold = /** @type {(inputs: Onboarding_Slides_Guardian_Slide1_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guide your child`)
};

const es_onboarding_slides_guardian_slide1_bold = /** @type {(inputs: Onboarding_Slides_Guardian_Slide1_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guía a tu hijo`)
};

const de_onboarding_slides_guardian_slide1_bold = /** @type {(inputs: Onboarding_Slides_Guardian_Slide1_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Begleite dein Kind`)
};

const ar_onboarding_slides_guardian_slide1_bold = /** @type {(inputs: Onboarding_Slides_Guardian_Slide1_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`وجّه طفلك`)
};

const fr_onboarding_slides_guardian_slide1_bold = /** @type {(inputs: Onboarding_Slides_Guardian_Slide1_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guidez votre enfant`)
};

const ko_onboarding_slides_guardian_slide1_bold = /** @type {(inputs: Onboarding_Slides_Guardian_Slide1_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`자녀 안내`)
};

/**
* | output |
* | --- |
* | "Guide your child" |
*
* @param {Onboarding_Slides_Guardian_Slide1_BoldInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_guardian_slide1_bold = /** @type {((inputs?: Onboarding_Slides_Guardian_Slide1_BoldInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Guardian_Slide1_BoldInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_guardian_slide1_bold(inputs)
	if (locale === "es") return es_onboarding_slides_guardian_slide1_bold(inputs)
	if (locale === "de") return de_onboarding_slides_guardian_slide1_bold(inputs)
	if (locale === "ar") return ar_onboarding_slides_guardian_slide1_bold(inputs)
	if (locale === "fr") return fr_onboarding_slides_guardian_slide1_bold(inputs)
	return ko_onboarding_slides_guardian_slide1_bold(inputs)
});
export { onboarding_slides_guardian_slide1_bold as "onboarding.slides.guardian.slide1.bold" }