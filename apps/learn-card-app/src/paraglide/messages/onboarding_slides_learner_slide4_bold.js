/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Slides_Learner_Slide4_BoldInputs */

const en_onboarding_slides_learner_slide4_bold = /** @type {(inputs: Onboarding_Slides_Learner_Slide4_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Level up`)
};

const es_onboarding_slides_learner_slide4_bold = /** @type {(inputs: Onboarding_Slides_Learner_Slide4_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sube de nivel`)
};

const fr_onboarding_slides_learner_slide4_bold = /** @type {(inputs: Onboarding_Slides_Learner_Slide4_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Progressez`)
};

const ar_onboarding_slides_learner_slide4_bold = /** @type {(inputs: Onboarding_Slides_Learner_Slide4_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ارتقِ`)
};

/**
* | output |
* | --- |
* | "Level up" |
*
* @param {Onboarding_Slides_Learner_Slide4_BoldInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_learner_slide4_bold = /** @type {((inputs?: Onboarding_Slides_Learner_Slide4_BoldInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Learner_Slide4_BoldInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_learner_slide4_bold(inputs)
	if (locale === "es") return es_onboarding_slides_learner_slide4_bold(inputs)
	if (locale === "fr") return fr_onboarding_slides_learner_slide4_bold(inputs)
	return ar_onboarding_slides_learner_slide4_bold(inputs)
});
export { onboarding_slides_learner_slide4_bold as "onboarding.slides.learner.slide4.bold" }