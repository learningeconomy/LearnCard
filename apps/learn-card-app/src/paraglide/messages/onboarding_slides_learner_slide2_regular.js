/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Slides_Learner_Slide2_RegularInputs */

const en_onboarding_slides_learner_slide2_regular = /** @type {(inputs: Onboarding_Slides_Learner_Slide2_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`your education experiences in your Passport`)
};

const es_onboarding_slides_learner_slide2_regular = /** @type {(inputs: Onboarding_Slides_Learner_Slide2_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`tus experiencias educativas en tu Pasaporte`)
};

const de_onboarding_slides_learner_slide2_regular = /** @type {(inputs: Onboarding_Slides_Learner_Slide2_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`deine Bildungserfahrungen in deinem Ausweis`)
};

const ar_onboarding_slides_learner_slide2_regular = /** @type {(inputs: Onboarding_Slides_Learner_Slide2_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خبراتك التعليمية في جواز سفرك`)
};

const fr_onboarding_slides_learner_slide2_regular = /** @type {(inputs: Onboarding_Slides_Learner_Slide2_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`vos expériences éducatives dans votre Passeport`)
};

const ko_onboarding_slides_learner_slide2_regular = /** @type {(inputs: Onboarding_Slides_Learner_Slide2_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`교육 경험을 패스포트에 수집하세요`)
};

/**
* | output |
* | --- |
* | "your education experiences in your Passport" |
*
* @param {Onboarding_Slides_Learner_Slide2_RegularInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_learner_slide2_regular = /** @type {((inputs?: Onboarding_Slides_Learner_Slide2_RegularInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Learner_Slide2_RegularInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_learner_slide2_regular(inputs)
	if (locale === "es") return es_onboarding_slides_learner_slide2_regular(inputs)
	if (locale === "de") return de_onboarding_slides_learner_slide2_regular(inputs)
	if (locale === "ar") return ar_onboarding_slides_learner_slide2_regular(inputs)
	if (locale === "fr") return fr_onboarding_slides_learner_slide2_regular(inputs)
	return ko_onboarding_slides_learner_slide2_regular(inputs)
});
export { onboarding_slides_learner_slide2_regular as "onboarding.slides.learner.slide2.regular" }