/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Slides_Teacher_Slide2_RegularInputs */

const en_onboarding_slides_teacher_slide2_regular = /** @type {(inputs: Onboarding_Slides_Teacher_Slide2_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`customized credentials`)
};

const es_onboarding_slides_teacher_slide2_regular = /** @type {(inputs: Onboarding_Slides_Teacher_Slide2_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`credenciales personalizadas`)
};

const de_onboarding_slides_teacher_slide2_regular = /** @type {(inputs: Onboarding_Slides_Teacher_Slide2_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`maßgeschneiderte Nachweise`)
};

const ar_onboarding_slides_teacher_slide2_regular = /** @type {(inputs: Onboarding_Slides_Teacher_Slide2_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بيانات اعتماد مخصصة`)
};

const fr_onboarding_slides_teacher_slide2_regular = /** @type {(inputs: Onboarding_Slides_Teacher_Slide2_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`des certifications personnalisées`)
};

const ko_onboarding_slides_teacher_slide2_regular = /** @type {(inputs: Onboarding_Slides_Teacher_Slide2_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`생성 및 관리`)
};

/**
* | output |
* | --- |
* | "customized credentials" |
*
* @param {Onboarding_Slides_Teacher_Slide2_RegularInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_teacher_slide2_regular = /** @type {((inputs?: Onboarding_Slides_Teacher_Slide2_RegularInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Teacher_Slide2_RegularInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_teacher_slide2_regular(inputs)
	if (locale === "es") return es_onboarding_slides_teacher_slide2_regular(inputs)
	if (locale === "de") return de_onboarding_slides_teacher_slide2_regular(inputs)
	if (locale === "ar") return ar_onboarding_slides_teacher_slide2_regular(inputs)
	if (locale === "fr") return fr_onboarding_slides_teacher_slide2_regular(inputs)
	return ko_onboarding_slides_teacher_slide2_regular(inputs)
});
export { onboarding_slides_teacher_slide2_regular as "onboarding.slides.teacher.slide2.regular" }