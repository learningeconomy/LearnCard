/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Slides_Learner_Slide3_RegularInputs */

const en_onboarding_slides_learner_slide3_regular = /** @type {(inputs: Onboarding_Slides_Learner_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`about your Skills & Experiences`)
};

const es_onboarding_slides_learner_slide3_regular = /** @type {(inputs: Onboarding_Slides_Learner_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`sobre tus Habilidades y Experiencias`)
};

const de_onboarding_slides_learner_slide3_regular = /** @type {(inputs: Onboarding_Slides_Learner_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`über deine Fähigkeiten und Erfahrungen`)
};

const ar_onboarding_slides_learner_slide3_regular = /** @type {(inputs: Onboarding_Slides_Learner_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عن مهاراتك وخبراتك`)
};

const fr_onboarding_slides_learner_slide3_regular = /** @type {(inputs: Onboarding_Slides_Learner_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`sur vos Compétences et Expériences`)
};

const ko_onboarding_slides_learner_slide3_regular = /** @type {(inputs: Onboarding_Slides_Learner_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`기술 및 경험에 대해 알아보세요`)
};

/**
* | output |
* | --- |
* | "about your Skills & Experiences" |
*
* @param {Onboarding_Slides_Learner_Slide3_RegularInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_learner_slide3_regular = /** @type {((inputs?: Onboarding_Slides_Learner_Slide3_RegularInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Learner_Slide3_RegularInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_learner_slide3_regular(inputs)
	if (locale === "es") return es_onboarding_slides_learner_slide3_regular(inputs)
	if (locale === "de") return de_onboarding_slides_learner_slide3_regular(inputs)
	if (locale === "ar") return ar_onboarding_slides_learner_slide3_regular(inputs)
	if (locale === "fr") return fr_onboarding_slides_learner_slide3_regular(inputs)
	return ko_onboarding_slides_learner_slide3_regular(inputs)
});
export { onboarding_slides_learner_slide3_regular as "onboarding.slides.learner.slide3.regular" }