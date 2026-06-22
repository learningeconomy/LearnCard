/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Slides_Admin_Slide1_RegularInputs */

const en_onboarding_slides_admin_slide1_regular = /** @type {(inputs: Onboarding_Slides_Admin_Slide1_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`skills frameworks and credentials`)
};

const es_onboarding_slides_admin_slide1_regular = /** @type {(inputs: Onboarding_Slides_Admin_Slide1_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`marcos de habilidades y credenciales`)
};

const fr_onboarding_slides_admin_slide1_regular = /** @type {(inputs: Onboarding_Slides_Admin_Slide1_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`des référentiels de compétences et des certifications`)
};

const ar_onboarding_slides_admin_slide1_regular = /** @type {(inputs: Onboarding_Slides_Admin_Slide1_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أطر المهارات وبيانات الاعتماد`)
};

/**
* | output |
* | --- |
* | "skills frameworks and credentials" |
*
* @param {Onboarding_Slides_Admin_Slide1_RegularInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_admin_slide1_regular = /** @type {((inputs?: Onboarding_Slides_Admin_Slide1_RegularInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Admin_Slide1_RegularInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_admin_slide1_regular(inputs)
	if (locale === "es") return es_onboarding_slides_admin_slide1_regular(inputs)
	if (locale === "fr") return fr_onboarding_slides_admin_slide1_regular(inputs)
	return ar_onboarding_slides_admin_slide1_regular(inputs)
});
export { onboarding_slides_admin_slide1_regular as "onboarding.slides.admin.slide1.regular" }