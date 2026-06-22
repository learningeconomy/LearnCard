/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Slides_Admin_Slide3_RegularInputs */

const en_onboarding_slides_admin_slide3_regular = /** @type {(inputs: Onboarding_Slides_Admin_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`your learning materials in one easy-to-use app`)
};

const es_onboarding_slides_admin_slide3_regular = /** @type {(inputs: Onboarding_Slides_Admin_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`tus materiales de aprendizaje en una app fácil de usar`)
};

const fr_onboarding_slides_admin_slide3_regular = /** @type {(inputs: Onboarding_Slides_Admin_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`vos supports d'apprentissage dans une application facile à utiliser`)
};

const ar_onboarding_slides_admin_slide3_regular = /** @type {(inputs: Onboarding_Slides_Admin_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مواد التعلم الخاصة بك في تطبيق سهل الاستخدام`)
};

/**
* | output |
* | --- |
* | "your learning materials in one easy-to-use app" |
*
* @param {Onboarding_Slides_Admin_Slide3_RegularInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_admin_slide3_regular = /** @type {((inputs?: Onboarding_Slides_Admin_Slide3_RegularInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Admin_Slide3_RegularInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_admin_slide3_regular(inputs)
	if (locale === "es") return es_onboarding_slides_admin_slide3_regular(inputs)
	if (locale === "fr") return fr_onboarding_slides_admin_slide3_regular(inputs)
	return ar_onboarding_slides_admin_slide3_regular(inputs)
});
export { onboarding_slides_admin_slide3_regular as "onboarding.slides.admin.slide3.regular" }