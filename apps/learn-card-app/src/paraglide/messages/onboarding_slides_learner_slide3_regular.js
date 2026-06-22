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

const fr_onboarding_slides_learner_slide3_regular = /** @type {(inputs: Onboarding_Slides_Learner_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`sur vos Compétences et Expériences`)
};

const ar_onboarding_slides_learner_slide3_regular = /** @type {(inputs: Onboarding_Slides_Learner_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عن مهاراتك وخبراتك`)
};

/**
* | output |
* | --- |
* | "about your Skills & Experiences" |
*
* @param {Onboarding_Slides_Learner_Slide3_RegularInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_learner_slide3_regular = /** @type {((inputs?: Onboarding_Slides_Learner_Slide3_RegularInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Learner_Slide3_RegularInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_learner_slide3_regular(inputs)
	if (locale === "es") return es_onboarding_slides_learner_slide3_regular(inputs)
	if (locale === "fr") return fr_onboarding_slides_learner_slide3_regular(inputs)
	return ar_onboarding_slides_learner_slide3_regular(inputs)
});
export { onboarding_slides_learner_slide3_regular as "onboarding.slides.learner.slide3.regular" }