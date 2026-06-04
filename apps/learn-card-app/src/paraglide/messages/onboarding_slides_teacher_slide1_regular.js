/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Slides_Teacher_Slide1_RegularInputs */

const en_onboarding_slides_teacher_slide1_regular = /** @type {(inputs: Onboarding_Slides_Teacher_Slide1_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`in one dashboard`)
};

const es_onboarding_slides_teacher_slide1_regular = /** @type {(inputs: Onboarding_Slides_Teacher_Slide1_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`en un solo panel`)
};

const de_onboarding_slides_teacher_slide1_regular = /** @type {(inputs: Onboarding_Slides_Teacher_Slide1_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`in einem Dashboard`)
};

const ar_onboarding_slides_teacher_slide1_regular = /** @type {(inputs: Onboarding_Slides_Teacher_Slide1_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`في لوحة تحكم واحدة`)
};

const fr_onboarding_slides_teacher_slide1_regular = /** @type {(inputs: Onboarding_Slides_Teacher_Slide1_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`dans un seul tableau de bord`)
};

const ko_onboarding_slides_teacher_slide1_regular = /** @type {(inputs: Onboarding_Slides_Teacher_Slide1_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`하나의 대시보드에서`)
};

/**
* | output |
* | --- |
* | "in one dashboard" |
*
* @param {Onboarding_Slides_Teacher_Slide1_RegularInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_teacher_slide1_regular = /** @type {((inputs?: Onboarding_Slides_Teacher_Slide1_RegularInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Teacher_Slide1_RegularInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_teacher_slide1_regular(inputs)
	if (locale === "es") return es_onboarding_slides_teacher_slide1_regular(inputs)
	if (locale === "de") return de_onboarding_slides_teacher_slide1_regular(inputs)
	if (locale === "ar") return ar_onboarding_slides_teacher_slide1_regular(inputs)
	if (locale === "fr") return fr_onboarding_slides_teacher_slide1_regular(inputs)
	return ko_onboarding_slides_teacher_slide1_regular(inputs)
});
export { onboarding_slides_teacher_slide1_regular as "onboarding.slides.teacher.slide1.regular" }