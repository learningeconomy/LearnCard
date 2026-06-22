/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Slides_Teacher_Slide1_BoldInputs */

const en_onboarding_slides_teacher_slide1_bold = /** @type {(inputs: Onboarding_Slides_Teacher_Slide1_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Organize all your students & learning data`)
};

const es_onboarding_slides_teacher_slide1_bold = /** @type {(inputs: Onboarding_Slides_Teacher_Slide1_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Organiza todos tus estudiantes y datos`)
};

const fr_onboarding_slides_teacher_slide1_bold = /** @type {(inputs: Onboarding_Slides_Teacher_Slide1_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Organisez tous vos élèves et données`)
};

const ar_onboarding_slides_teacher_slide1_bold = /** @type {(inputs: Onboarding_Slides_Teacher_Slide1_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نظّم جميع طلابك وبيانات التعلم`)
};

/**
* | output |
* | --- |
* | "Organize all your students & learning data" |
*
* @param {Onboarding_Slides_Teacher_Slide1_BoldInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_teacher_slide1_bold = /** @type {((inputs?: Onboarding_Slides_Teacher_Slide1_BoldInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Teacher_Slide1_BoldInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_teacher_slide1_bold(inputs)
	if (locale === "es") return es_onboarding_slides_teacher_slide1_bold(inputs)
	if (locale === "fr") return fr_onboarding_slides_teacher_slide1_bold(inputs)
	return ar_onboarding_slides_teacher_slide1_bold(inputs)
});
export { onboarding_slides_teacher_slide1_bold as "onboarding.slides.teacher.slide1.bold" }