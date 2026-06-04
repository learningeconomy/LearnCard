/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Slides_Admin_Slide4_RegularInputs */

const en_onboarding_slides_admin_slide4_regular = /** @type {(inputs: Onboarding_Slides_Admin_Slide4_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`advanced tools and settings for data sharing and more`)
};

const es_onboarding_slides_admin_slide4_regular = /** @type {(inputs: Onboarding_Slides_Admin_Slide4_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`herramientas avanzadas para compartir datos y más`)
};

const de_onboarding_slides_admin_slide4_regular = /** @type {(inputs: Onboarding_Slides_Admin_Slide4_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`erweiterte Tools für Datenaustausch und mehr`)
};

const ar_onboarding_slides_admin_slide4_regular = /** @type {(inputs: Onboarding_Slides_Admin_Slide4_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أدوات متقدمة لمشاركة البيانات والمزيد`)
};

const fr_onboarding_slides_admin_slide4_regular = /** @type {(inputs: Onboarding_Slides_Admin_Slide4_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`des outils avancés pour le partage de données et plus`)
};

const ko_onboarding_slides_admin_slide4_regular = /** @type {(inputs: Onboarding_Slides_Admin_Slide4_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`데이터 공유 등을 위한 고급 도구`)
};

/**
* | output |
* | --- |
* | "advanced tools and settings for data sharing and more" |
*
* @param {Onboarding_Slides_Admin_Slide4_RegularInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_admin_slide4_regular = /** @type {((inputs?: Onboarding_Slides_Admin_Slide4_RegularInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Admin_Slide4_RegularInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_admin_slide4_regular(inputs)
	if (locale === "es") return es_onboarding_slides_admin_slide4_regular(inputs)
	if (locale === "de") return de_onboarding_slides_admin_slide4_regular(inputs)
	if (locale === "ar") return ar_onboarding_slides_admin_slide4_regular(inputs)
	if (locale === "fr") return fr_onboarding_slides_admin_slide4_regular(inputs)
	return ko_onboarding_slides_admin_slide4_regular(inputs)
});
export { onboarding_slides_admin_slide4_regular as "onboarding.slides.admin.slide4.regular" }