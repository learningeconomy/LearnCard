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

const de_onboarding_slides_admin_slide3_regular = /** @type {(inputs: Onboarding_Slides_Admin_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`deine Lernmaterialien in einer benutzerfreundlichen App`)
};

const ar_onboarding_slides_admin_slide3_regular = /** @type {(inputs: Onboarding_Slides_Admin_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مواد التعلم الخاصة بك في تطبيق سهل الاستخدام`)
};

const fr_onboarding_slides_admin_slide3_regular = /** @type {(inputs: Onboarding_Slides_Admin_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`vos supports d'apprentissage dans une application facile à utiliser`)
};

const ko_onboarding_slides_admin_slide3_regular = /** @type {(inputs: Onboarding_Slides_Admin_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`사용하기 쉬운 앱으로 학습 자료 배포`)
};

/**
* | output |
* | --- |
* | "your learning materials in one easy-to-use app" |
*
* @param {Onboarding_Slides_Admin_Slide3_RegularInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_admin_slide3_regular = /** @type {((inputs?: Onboarding_Slides_Admin_Slide3_RegularInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Admin_Slide3_RegularInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_admin_slide3_regular(inputs)
	if (locale === "es") return es_onboarding_slides_admin_slide3_regular(inputs)
	if (locale === "de") return de_onboarding_slides_admin_slide3_regular(inputs)
	if (locale === "ar") return ar_onboarding_slides_admin_slide3_regular(inputs)
	if (locale === "fr") return fr_onboarding_slides_admin_slide3_regular(inputs)
	return ko_onboarding_slides_admin_slide3_regular(inputs)
});
export { onboarding_slides_admin_slide3_regular as "onboarding.slides.admin.slide3.regular" }