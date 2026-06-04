/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Slides_Learner_Slide4_RegularInputs */

const en_onboarding_slides_learner_slide4_regular = /** @type {(inputs: Onboarding_Slides_Learner_Slide4_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`your learning with a growing suite of AI Tutors`)
};

const es_onboarding_slides_learner_slide4_regular = /** @type {(inputs: Onboarding_Slides_Learner_Slide4_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`tu aprendizaje con una creciente suite de Tutores IA`)
};

const de_onboarding_slides_learner_slide4_regular = /** @type {(inputs: Onboarding_Slides_Learner_Slide4_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`mit einer wachsenden Suite von KI-Tutoren`)
};

const ar_onboarding_slides_learner_slide4_regular = /** @type {(inputs: Onboarding_Slides_Learner_Slide4_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بتعلمك مع مجموعة متنامية من المعلمين الذكاء الاصطناعي`)
};

const fr_onboarding_slides_learner_slide4_regular = /** @type {(inputs: Onboarding_Slides_Learner_Slide4_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`dans votre apprentissage avec une suite croissante de Tuteurs IA`)
};

const ko_onboarding_slides_learner_slide4_regular = /** @type {(inputs: Onboarding_Slides_Learner_Slide4_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`성장하는 AI 튜터로 학습을 향상시키세요`)
};

/**
* | output |
* | --- |
* | "your learning with a growing suite of AI Tutors" |
*
* @param {Onboarding_Slides_Learner_Slide4_RegularInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_learner_slide4_regular = /** @type {((inputs?: Onboarding_Slides_Learner_Slide4_RegularInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Learner_Slide4_RegularInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_learner_slide4_regular(inputs)
	if (locale === "es") return es_onboarding_slides_learner_slide4_regular(inputs)
	if (locale === "de") return de_onboarding_slides_learner_slide4_regular(inputs)
	if (locale === "ar") return ar_onboarding_slides_learner_slide4_regular(inputs)
	if (locale === "fr") return fr_onboarding_slides_learner_slide4_regular(inputs)
	return ko_onboarding_slides_learner_slide4_regular(inputs)
});
export { onboarding_slides_learner_slide4_regular as "onboarding.slides.learner.slide4.regular" }