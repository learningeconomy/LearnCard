/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Slides_Admin_Slide2_BoldInputs */

const en_onboarding_slides_admin_slide2_bold = /** @type {(inputs: Onboarding_Slides_Admin_Slide2_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Organize`)
};

const es_onboarding_slides_admin_slide2_bold = /** @type {(inputs: Onboarding_Slides_Admin_Slide2_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Organiza`)
};

const de_onboarding_slides_admin_slide2_bold = /** @type {(inputs: Onboarding_Slides_Admin_Slide2_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Organisiere`)
};

const ar_onboarding_slides_admin_slide2_bold = /** @type {(inputs: Onboarding_Slides_Admin_Slide2_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نظّم`)
};

const fr_onboarding_slides_admin_slide2_bold = /** @type {(inputs: Onboarding_Slides_Admin_Slide2_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Organisez`)
};

const ko_onboarding_slides_admin_slide2_bold = /** @type {(inputs: Onboarding_Slides_Admin_Slide2_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`정리`)
};

/**
* | output |
* | --- |
* | "Organize" |
*
* @param {Onboarding_Slides_Admin_Slide2_BoldInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_admin_slide2_bold = /** @type {((inputs?: Onboarding_Slides_Admin_Slide2_BoldInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Admin_Slide2_BoldInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_admin_slide2_bold(inputs)
	if (locale === "es") return es_onboarding_slides_admin_slide2_bold(inputs)
	if (locale === "de") return de_onboarding_slides_admin_slide2_bold(inputs)
	if (locale === "ar") return ar_onboarding_slides_admin_slide2_bold(inputs)
	if (locale === "fr") return fr_onboarding_slides_admin_slide2_bold(inputs)
	return ko_onboarding_slides_admin_slide2_bold(inputs)
});
export { onboarding_slides_admin_slide2_bold as "onboarding.slides.admin.slide2.bold" }