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

const fr_onboarding_slides_learner_slide2_regular = /** @type {(inputs: Onboarding_Slides_Learner_Slide2_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`vos expériences éducatives dans votre Passeport`)
};

const ar_onboarding_slides_learner_slide2_regular = /** @type {(inputs: Onboarding_Slides_Learner_Slide2_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خبراتك التعليمية في جواز سفرك`)
};

/**
* | output |
* | --- |
* | "your education experiences in your Passport" |
*
* @param {Onboarding_Slides_Learner_Slide2_RegularInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_learner_slide2_regular = /** @type {((inputs?: Onboarding_Slides_Learner_Slide2_RegularInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Learner_Slide2_RegularInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_learner_slide2_regular(inputs)
	if (locale === "es") return es_onboarding_slides_learner_slide2_regular(inputs)
	if (locale === "fr") return fr_onboarding_slides_learner_slide2_regular(inputs)
	return ar_onboarding_slides_learner_slide2_regular(inputs)
});
export { onboarding_slides_learner_slide2_regular as "onboarding.slides.learner.slide2.regular" }