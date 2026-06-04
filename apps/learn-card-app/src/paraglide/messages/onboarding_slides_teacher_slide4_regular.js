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

const de_onboarding_slides_teacher_slide4_regular = /** @type {(inputs: Onboarding_Slides_Teacher_Slide4_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`den Fortschritt deiner Schüler in Echtzeit`)
};

const ar_onboarding_slides_teacher_slide4_regular = /** @type {(inputs: Onboarding_Slides_Teacher_Slide4_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تقدم طلابك في الوقت الفعلي`)
};

const fr_onboarding_slides_teacher_slide4_regular = /** @type {(inputs: Onboarding_Slides_Teacher_Slide4_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`les progrès de vos élèves en temps réel`)
};

const ko_onboarding_slides_teacher_slide4_regular = /** @type {(inputs: Onboarding_Slides_Teacher_Slide4_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`학생의 진행 상황을 실시간으로`)
};

/**
* | output |
* | --- |
* | "your student's progress in real time" |
*
* @param {Onboarding_Slides_Teacher_Slide4_RegularInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_teacher_slide4_regular = /** @type {((inputs?: Onboarding_Slides_Teacher_Slide4_RegularInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Teacher_Slide4_RegularInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_teacher_slide4_regular(inputs)
	if (locale === "es") return es_onboarding_slides_teacher_slide4_regular(inputs)
	if (locale === "de") return de_onboarding_slides_teacher_slide4_regular(inputs)
	if (locale === "ar") return ar_onboarding_slides_teacher_slide4_regular(inputs)
	if (locale === "fr") return fr_onboarding_slides_teacher_slide4_regular(inputs)
	return ko_onboarding_slides_teacher_slide4_regular(inputs)
});
export { onboarding_slides_teacher_slide4_regular as "onboarding.slides.teacher.slide4.regular" }