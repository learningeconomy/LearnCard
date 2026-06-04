/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Slides_Teacher_Slide3_RegularInputs */

const en_onboarding_slides_teacher_slide3_regular = /** @type {(inputs: Onboarding_Slides_Teacher_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`learners with real, high-fidelity proof of learning experiences`)
};

const es_onboarding_slides_teacher_slide3_regular = /** @type {(inputs: Onboarding_Slides_Teacher_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`a los estudiantes prueba real de experiencias de aprendizaje`)
};

const de_onboarding_slides_teacher_slide3_regular = /** @type {(inputs: Onboarding_Slides_Teacher_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lernenden echte, hochwertige Nachweise über Lernerfahrungen`)
};

const ar_onboarding_slides_teacher_slide3_regular = /** @type {(inputs: Onboarding_Slides_Teacher_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المتعلمين دليلاً حقيقياً وعالي الدقة على تجارب التعلم`)
};

const fr_onboarding_slides_teacher_slide3_regular = /** @type {(inputs: Onboarding_Slides_Teacher_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`aux apprenants une preuve réelle des expériences d'apprentissage`)
};

const ko_onboarding_slides_teacher_slide3_regular = /** @type {(inputs: Onboarding_Slides_Teacher_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`학습 경험에 대한 실제 증명을 학습자에게`)
};

/**
* | output |
* | --- |
* | "learners with real, high-fidelity proof of learning experiences" |
*
* @param {Onboarding_Slides_Teacher_Slide3_RegularInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_teacher_slide3_regular = /** @type {((inputs?: Onboarding_Slides_Teacher_Slide3_RegularInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Teacher_Slide3_RegularInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_teacher_slide3_regular(inputs)
	if (locale === "es") return es_onboarding_slides_teacher_slide3_regular(inputs)
	if (locale === "de") return de_onboarding_slides_teacher_slide3_regular(inputs)
	if (locale === "ar") return ar_onboarding_slides_teacher_slide3_regular(inputs)
	if (locale === "fr") return fr_onboarding_slides_teacher_slide3_regular(inputs)
	return ko_onboarding_slides_teacher_slide3_regular(inputs)
});
export { onboarding_slides_teacher_slide3_regular as "onboarding.slides.teacher.slide3.regular" }