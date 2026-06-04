/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Slides_Developer_Slide3_BoldInputs */

const en_onboarding_slides_developer_slide3_bold = /** @type {(inputs: Onboarding_Slides_Developer_Slide3_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manage`)
};

const es_onboarding_slides_developer_slide3_bold = /** @type {(inputs: Onboarding_Slides_Developer_Slide3_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Administra`)
};

const de_onboarding_slides_developer_slide3_bold = /** @type {(inputs: Onboarding_Slides_Developer_Slide3_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verwalte`)
};

const ar_onboarding_slides_developer_slide3_bold = /** @type {(inputs: Onboarding_Slides_Developer_Slide3_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أدر`)
};

const fr_onboarding_slides_developer_slide3_bold = /** @type {(inputs: Onboarding_Slides_Developer_Slide3_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gérez`)
};

const ko_onboarding_slides_developer_slide3_bold = /** @type {(inputs: Onboarding_Slides_Developer_Slide3_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`관리`)
};

/**
* | output |
* | --- |
* | "Manage" |
*
* @param {Onboarding_Slides_Developer_Slide3_BoldInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_developer_slide3_bold = /** @type {((inputs?: Onboarding_Slides_Developer_Slide3_BoldInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Developer_Slide3_BoldInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_developer_slide3_bold(inputs)
	if (locale === "es") return es_onboarding_slides_developer_slide3_bold(inputs)
	if (locale === "de") return de_onboarding_slides_developer_slide3_bold(inputs)
	if (locale === "ar") return ar_onboarding_slides_developer_slide3_bold(inputs)
	if (locale === "fr") return fr_onboarding_slides_developer_slide3_bold(inputs)
	return ko_onboarding_slides_developer_slide3_bold(inputs)
});
export { onboarding_slides_developer_slide3_bold as "onboarding.slides.developer.slide3.bold" }