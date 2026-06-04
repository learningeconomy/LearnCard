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

const de_onboarding_slides_guardian_slide1_regular = /** @type {(inputs: Onboarding_Slides_Guardian_Slide1_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`durch Lernerfahrungen`)
};

const ar_onboarding_slides_guardian_slide1_regular = /** @type {(inputs: Onboarding_Slides_Guardian_Slide1_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خلال تجارب التعلم`)
};

const fr_onboarding_slides_guardian_slide1_regular = /** @type {(inputs: Onboarding_Slides_Guardian_Slide1_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`dans ses expériences d'apprentissage`)
};

const ko_onboarding_slides_guardian_slide1_regular = /** @type {(inputs: Onboarding_Slides_Guardian_Slide1_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`학습 경험을 통해`)
};

/**
* | output |
* | --- |
* | "through learning experiences" |
*
* @param {Onboarding_Slides_Guardian_Slide1_RegularInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_guardian_slide1_regular = /** @type {((inputs?: Onboarding_Slides_Guardian_Slide1_RegularInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Guardian_Slide1_RegularInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_guardian_slide1_regular(inputs)
	if (locale === "es") return es_onboarding_slides_guardian_slide1_regular(inputs)
	if (locale === "de") return de_onboarding_slides_guardian_slide1_regular(inputs)
	if (locale === "ar") return ar_onboarding_slides_guardian_slide1_regular(inputs)
	if (locale === "fr") return fr_onboarding_slides_guardian_slide1_regular(inputs)
	return ko_onboarding_slides_guardian_slide1_regular(inputs)
});
export { onboarding_slides_guardian_slide1_regular as "onboarding.slides.guardian.slide1.regular" }