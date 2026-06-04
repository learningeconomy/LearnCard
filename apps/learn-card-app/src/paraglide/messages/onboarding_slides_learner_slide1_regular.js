/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Slides_Learner_Slide1_RegularInputs */

const en_onboarding_slides_learner_slide1_regular = /** @type {(inputs: Onboarding_Slides_Learner_Slide1_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`your learning wherever it happens`)
};

const es_onboarding_slides_learner_slide1_regular = /** @type {(inputs: Onboarding_Slides_Learner_Slide1_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`tu aprendizaje donde sea que ocurra`)
};

const de_onboarding_slides_learner_slide1_regular = /** @type {(inputs: Onboarding_Slides_Learner_Slide1_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`dein Lernen, wo immer es stattfindet`)
};

const ar_onboarding_slides_learner_slide1_regular = /** @type {(inputs: Onboarding_Slides_Learner_Slide1_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعلمك أينما حدث`)
};

const fr_onboarding_slides_learner_slide1_regular = /** @type {(inputs: Onboarding_Slides_Learner_Slide1_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`votre apprentissage où qu'il se produise`)
};

const ko_onboarding_slides_learner_slide1_regular = /** @type {(inputs: Onboarding_Slides_Learner_Slide1_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`어디서든 학습을 캡처하세요`)
};

/**
* | output |
* | --- |
* | "your learning wherever it happens" |
*
* @param {Onboarding_Slides_Learner_Slide1_RegularInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_learner_slide1_regular = /** @type {((inputs?: Onboarding_Slides_Learner_Slide1_RegularInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Learner_Slide1_RegularInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_learner_slide1_regular(inputs)
	if (locale === "es") return es_onboarding_slides_learner_slide1_regular(inputs)
	if (locale === "de") return de_onboarding_slides_learner_slide1_regular(inputs)
	if (locale === "ar") return ar_onboarding_slides_learner_slide1_regular(inputs)
	if (locale === "fr") return fr_onboarding_slides_learner_slide1_regular(inputs)
	return ko_onboarding_slides_learner_slide1_regular(inputs)
});
export { onboarding_slides_learner_slide1_regular as "onboarding.slides.learner.slide1.regular" }