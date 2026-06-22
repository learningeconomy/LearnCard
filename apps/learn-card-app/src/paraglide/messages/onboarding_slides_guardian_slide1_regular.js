/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Slides_Guardian_Slide1_RegularInputs */

const en_onboarding_slides_guardian_slide1_regular = /** @type {(inputs: Onboarding_Slides_Guardian_Slide1_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`through learning experiences`)
};

const es_onboarding_slides_guardian_slide1_regular = /** @type {(inputs: Onboarding_Slides_Guardian_Slide1_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`a través de experiencias de aprendizaje`)
};

const fr_onboarding_slides_guardian_slide1_regular = /** @type {(inputs: Onboarding_Slides_Guardian_Slide1_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`dans ses expériences d'apprentissage`)
};

const ar_onboarding_slides_guardian_slide1_regular = /** @type {(inputs: Onboarding_Slides_Guardian_Slide1_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خلال تجارب التعلم`)
};

/**
* | output |
* | --- |
* | "through learning experiences" |
*
* @param {Onboarding_Slides_Guardian_Slide1_RegularInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_guardian_slide1_regular = /** @type {((inputs?: Onboarding_Slides_Guardian_Slide1_RegularInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Guardian_Slide1_RegularInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_guardian_slide1_regular(inputs)
	if (locale === "es") return es_onboarding_slides_guardian_slide1_regular(inputs)
	if (locale === "fr") return fr_onboarding_slides_guardian_slide1_regular(inputs)
	return ar_onboarding_slides_guardian_slide1_regular(inputs)
});
export { onboarding_slides_guardian_slide1_regular as "onboarding.slides.guardian.slide1.regular" }