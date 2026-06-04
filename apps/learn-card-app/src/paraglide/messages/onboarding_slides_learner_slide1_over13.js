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

const de_onboarding_slides_learner_slide1_over13 = /** @type {(inputs: Onboarding_Slides_Learner_Slide1_Over13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`deine Lern- und Arbeitserfahrungen`)
};

const ar_onboarding_slides_learner_slide1_over13 = /** @type {(inputs: Onboarding_Slides_Learner_Slide1_Over13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خبراتك في التعلم والعمل`)
};

const fr_onboarding_slides_learner_slide1_over13 = /** @type {(inputs: Onboarding_Slides_Learner_Slide1_Over13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`vos expériences d'apprentissage et de travail`)
};

const ko_onboarding_slides_learner_slide1_over13 = /** @type {(inputs: Onboarding_Slides_Learner_Slide1_Over13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`학습 및 업무 경험`)
};

/**
* | output |
* | --- |
* | "your learning & work experiences" |
*
* @param {Onboarding_Slides_Learner_Slide1_Over13Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_learner_slide1_over13 = /** @type {((inputs?: Onboarding_Slides_Learner_Slide1_Over13Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Learner_Slide1_Over13Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_learner_slide1_over13(inputs)
	if (locale === "es") return es_onboarding_slides_learner_slide1_over13(inputs)
	if (locale === "de") return de_onboarding_slides_learner_slide1_over13(inputs)
	if (locale === "ar") return ar_onboarding_slides_learner_slide1_over13(inputs)
	if (locale === "fr") return fr_onboarding_slides_learner_slide1_over13(inputs)
	return ko_onboarding_slides_learner_slide1_over13(inputs)
});
export { onboarding_slides_learner_slide1_over13 as "onboarding.slides.learner.slide1.over13" }