/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Slides_Teacher_Slide2_BoldInputs */

const en_onboarding_slides_teacher_slide2_bold = /** @type {(inputs: Onboarding_Slides_Teacher_Slide2_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create and manage`)
};

const es_onboarding_slides_teacher_slide2_bold = /** @type {(inputs: Onboarding_Slides_Teacher_Slide2_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crea y administra`)
};

const fr_onboarding_slides_teacher_slide2_bold = /** @type {(inputs: Onboarding_Slides_Teacher_Slide2_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créez et gérez`)
};

const ar_onboarding_slides_teacher_slide2_bold = /** @type {(inputs: Onboarding_Slides_Teacher_Slide2_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنشئ وأدر`)
};

/**
* | output |
* | --- |
* | "Create and manage" |
*
* @param {Onboarding_Slides_Teacher_Slide2_BoldInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_teacher_slide2_bold = /** @type {((inputs?: Onboarding_Slides_Teacher_Slide2_BoldInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Teacher_Slide2_BoldInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_teacher_slide2_bold(inputs)
	if (locale === "es") return es_onboarding_slides_teacher_slide2_bold(inputs)
	if (locale === "fr") return fr_onboarding_slides_teacher_slide2_bold(inputs)
	return ar_onboarding_slides_teacher_slide2_bold(inputs)
});
export { onboarding_slides_teacher_slide2_bold as "onboarding.slides.teacher.slide2.bold" }