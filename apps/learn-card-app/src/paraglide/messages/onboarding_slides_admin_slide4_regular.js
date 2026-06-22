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

const fr_onboarding_slides_admin_slide4_regular = /** @type {(inputs: Onboarding_Slides_Admin_Slide4_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`des outils avancés pour le partage de données et plus`)
};

const ar_onboarding_slides_admin_slide4_regular = /** @type {(inputs: Onboarding_Slides_Admin_Slide4_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أدوات متقدمة لمشاركة البيانات والمزيد`)
};

/**
* | output |
* | --- |
* | "advanced tools and settings for data sharing and more" |
*
* @param {Onboarding_Slides_Admin_Slide4_RegularInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_admin_slide4_regular = /** @type {((inputs?: Onboarding_Slides_Admin_Slide4_RegularInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Admin_Slide4_RegularInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_admin_slide4_regular(inputs)
	if (locale === "es") return es_onboarding_slides_admin_slide4_regular(inputs)
	if (locale === "fr") return fr_onboarding_slides_admin_slide4_regular(inputs)
	return ar_onboarding_slides_admin_slide4_regular(inputs)
});
export { onboarding_slides_admin_slide4_regular as "onboarding.slides.admin.slide4.regular" }