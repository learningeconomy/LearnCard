/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Slides_Admin_Slide2_RegularInputs */

const en_onboarding_slides_admin_slide2_regular = /** @type {(inputs: Onboarding_Slides_Admin_Slide2_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`your learners, teachers, and learning experiences`)
};

const es_onboarding_slides_admin_slide2_regular = /** @type {(inputs: Onboarding_Slides_Admin_Slide2_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`tus estudiantes, profesores y experiencias de aprendizaje`)
};

const fr_onboarding_slides_admin_slide2_regular = /** @type {(inputs: Onboarding_Slides_Admin_Slide2_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`vos apprenants, enseignants et expériences d'apprentissage`)
};

const ar_onboarding_slides_admin_slide2_regular = /** @type {(inputs: Onboarding_Slides_Admin_Slide2_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المتعلمين والمعلمين وتجارب التعلم`)
};

/**
* | output |
* | --- |
* | "your learners, teachers, and learning experiences" |
*
* @param {Onboarding_Slides_Admin_Slide2_RegularInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_admin_slide2_regular = /** @type {((inputs?: Onboarding_Slides_Admin_Slide2_RegularInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Admin_Slide2_RegularInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_admin_slide2_regular(inputs)
	if (locale === "es") return es_onboarding_slides_admin_slide2_regular(inputs)
	if (locale === "fr") return fr_onboarding_slides_admin_slide2_regular(inputs)
	return ar_onboarding_slides_admin_slide2_regular(inputs)
});
export { onboarding_slides_admin_slide2_regular as "onboarding.slides.admin.slide2.regular" }