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

const fr_onboarding_slides_guardian_slide3_regular = /** @type {(inputs: Onboarding_Slides_Guardian_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`l'apprentissage de votre enfant avec des tuteurs IA et des applications éducatives`)
};

const ar_onboarding_slides_guardian_slide3_regular = /** @type {(inputs: Onboarding_Slides_Guardian_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعلم طفلك مع معلمي الذكاء الاصطناعي وتطبيقات التعلم`)
};

/**
* | output |
* | --- |
* | "your child's learning with AI tutors and learning apps" |
*
* @param {Onboarding_Slides_Guardian_Slide3_RegularInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_guardian_slide3_regular = /** @type {((inputs?: Onboarding_Slides_Guardian_Slide3_RegularInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Guardian_Slide3_RegularInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_guardian_slide3_regular(inputs)
	if (locale === "es") return es_onboarding_slides_guardian_slide3_regular(inputs)
	if (locale === "fr") return fr_onboarding_slides_guardian_slide3_regular(inputs)
	return ar_onboarding_slides_guardian_slide3_regular(inputs)
});
export { onboarding_slides_guardian_slide3_regular as "onboarding.slides.guardian.slide3.regular" }