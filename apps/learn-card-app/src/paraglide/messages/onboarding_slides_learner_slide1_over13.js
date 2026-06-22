/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Slides_Learner_Slide1_Over13Inputs */

const en_onboarding_slides_learner_slide1_over13 = /** @type {(inputs: Onboarding_Slides_Learner_Slide1_Over13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`your learning & work experiences`)
};

const es_onboarding_slides_learner_slide1_over13 = /** @type {(inputs: Onboarding_Slides_Learner_Slide1_Over13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`tus experiencias de aprendizaje y trabajo`)
};

const fr_onboarding_slides_learner_slide1_over13 = /** @type {(inputs: Onboarding_Slides_Learner_Slide1_Over13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`vos expériences d'apprentissage et de travail`)
};

const ar_onboarding_slides_learner_slide1_over13 = /** @type {(inputs: Onboarding_Slides_Learner_Slide1_Over13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خبراتك في التعلم والعمل`)
};

/**
* | output |
* | --- |
* | "your learning & work experiences" |
*
* @param {Onboarding_Slides_Learner_Slide1_Over13Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_learner_slide1_over13 = /** @type {((inputs?: Onboarding_Slides_Learner_Slide1_Over13Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Learner_Slide1_Over13Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_learner_slide1_over13(inputs)
	if (locale === "es") return es_onboarding_slides_learner_slide1_over13(inputs)
	if (locale === "fr") return fr_onboarding_slides_learner_slide1_over13(inputs)
	return ar_onboarding_slides_learner_slide1_over13(inputs)
});
export { onboarding_slides_learner_slide1_over13 as "onboarding.slides.learner.slide1.over13" }