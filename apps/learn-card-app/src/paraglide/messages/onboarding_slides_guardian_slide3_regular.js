/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Slides_Guardian_Slide3_RegularInputs */

const en_onboarding_slides_guardian_slide3_regular = /** @type {(inputs: Onboarding_Slides_Guardian_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`your child's learning with AI tutors and learning apps`)
};

const es_onboarding_slides_guardian_slide3_regular = /** @type {(inputs: Onboarding_Slides_Guardian_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`el aprendizaje de tu hijo con tutores IA y apps educativas`)
};

const de_onboarding_slides_guardian_slide3_regular = /** @type {(inputs: Onboarding_Slides_Guardian_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`das Lernen deines Kindes mit KI-Tutoren und Lern-Apps`)
};

const ar_onboarding_slides_guardian_slide3_regular = /** @type {(inputs: Onboarding_Slides_Guardian_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعلم طفلك مع معلمي الذكاء الاصطناعي وتطبيقات التعلم`)
};

const fr_onboarding_slides_guardian_slide3_regular = /** @type {(inputs: Onboarding_Slides_Guardian_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`l'apprentissage de votre enfant avec des tuteurs IA et des applications éducatives`)
};

const ko_onboarding_slides_guardian_slide3_regular = /** @type {(inputs: Onboarding_Slides_Guardian_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI 튜터와 학습 앱으로 자녀의 학습 향상`)
};

/**
* | output |
* | --- |
* | "your child's learning with AI tutors and learning apps" |
*
* @param {Onboarding_Slides_Guardian_Slide3_RegularInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_guardian_slide3_regular = /** @type {((inputs?: Onboarding_Slides_Guardian_Slide3_RegularInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Guardian_Slide3_RegularInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_guardian_slide3_regular(inputs)
	if (locale === "es") return es_onboarding_slides_guardian_slide3_regular(inputs)
	if (locale === "de") return de_onboarding_slides_guardian_slide3_regular(inputs)
	if (locale === "ar") return ar_onboarding_slides_guardian_slide3_regular(inputs)
	if (locale === "fr") return fr_onboarding_slides_guardian_slide3_regular(inputs)
	return ko_onboarding_slides_guardian_slide3_regular(inputs)
});
export { onboarding_slides_guardian_slide3_regular as "onboarding.slides.guardian.slide3.regular" }