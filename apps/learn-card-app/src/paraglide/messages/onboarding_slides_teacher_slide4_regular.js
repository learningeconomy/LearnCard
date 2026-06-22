/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Slides_Teacher_Slide4_RegularInputs */

const en_onboarding_slides_teacher_slide4_regular = /** @type {(inputs: Onboarding_Slides_Teacher_Slide4_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`your student's progress in real time`)
};

const es_onboarding_slides_teacher_slide4_regular = /** @type {(inputs: Onboarding_Slides_Teacher_Slide4_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`el progreso de tus estudiantes en tiempo real`)
};

const fr_onboarding_slides_teacher_slide4_regular = /** @type {(inputs: Onboarding_Slides_Teacher_Slide4_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`les progrès de vos élèves en temps réel`)
};

const ar_onboarding_slides_teacher_slide4_regular = /** @type {(inputs: Onboarding_Slides_Teacher_Slide4_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تقدم طلابك في الوقت الفعلي`)
};

/**
* | output |
* | --- |
* | "your student's progress in real time" |
*
* @param {Onboarding_Slides_Teacher_Slide4_RegularInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_teacher_slide4_regular = /** @type {((inputs?: Onboarding_Slides_Teacher_Slide4_RegularInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Teacher_Slide4_RegularInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_teacher_slide4_regular(inputs)
	if (locale === "es") return es_onboarding_slides_teacher_slide4_regular(inputs)
	if (locale === "fr") return fr_onboarding_slides_teacher_slide4_regular(inputs)
	return ar_onboarding_slides_teacher_slide4_regular(inputs)
});
export { onboarding_slides_teacher_slide4_regular as "onboarding.slides.teacher.slide4.regular" }