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

const fr_onboarding_slides_learner_slide4_regular = /** @type {(inputs: Onboarding_Slides_Learner_Slide4_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`dans votre apprentissage avec une suite croissante de Tuteurs IA`)
};

const ar_onboarding_slides_learner_slide4_regular = /** @type {(inputs: Onboarding_Slides_Learner_Slide4_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بتعلمك مع مجموعة متنامية من المعلمين الذكاء الاصطناعي`)
};

/**
* | output |
* | --- |
* | "your learning with a growing suite of AI Tutors" |
*
* @param {Onboarding_Slides_Learner_Slide4_RegularInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_learner_slide4_regular = /** @type {((inputs?: Onboarding_Slides_Learner_Slide4_RegularInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Learner_Slide4_RegularInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_learner_slide4_regular(inputs)
	if (locale === "es") return es_onboarding_slides_learner_slide4_regular(inputs)
	if (locale === "fr") return fr_onboarding_slides_learner_slide4_regular(inputs)
	return ar_onboarding_slides_learner_slide4_regular(inputs)
});
export { onboarding_slides_learner_slide4_regular as "onboarding.slides.learner.slide4.regular" }