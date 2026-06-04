/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Slides_Developer_Slide4_BoldInputs */

const en_onboarding_slides_developer_slide4_bold = /** @type {(inputs: Onboarding_Slides_Developer_Slide4_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Design`)
};

const es_onboarding_slides_developer_slide4_bold = /** @type {(inputs: Onboarding_Slides_Developer_Slide4_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Diseña`)
};

const de_onboarding_slides_developer_slide4_bold = /** @type {(inputs: Onboarding_Slides_Developer_Slide4_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestalte`)
};

const ar_onboarding_slides_developer_slide4_bold = /** @type {(inputs: Onboarding_Slides_Developer_Slide4_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صمّم`)
};

const fr_onboarding_slides_developer_slide4_bold = /** @type {(inputs: Onboarding_Slides_Developer_Slide4_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Concevez`)
};

const ko_onboarding_slides_developer_slide4_bold = /** @type {(inputs: Onboarding_Slides_Developer_Slide4_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`설계`)
};

/**
* | output |
* | --- |
* | "Design" |
*
* @param {Onboarding_Slides_Developer_Slide4_BoldInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_developer_slide4_bold = /** @type {((inputs?: Onboarding_Slides_Developer_Slide4_BoldInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Developer_Slide4_BoldInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_developer_slide4_bold(inputs)
	if (locale === "es") return es_onboarding_slides_developer_slide4_bold(inputs)
	if (locale === "de") return de_onboarding_slides_developer_slide4_bold(inputs)
	if (locale === "ar") return ar_onboarding_slides_developer_slide4_bold(inputs)
	if (locale === "fr") return fr_onboarding_slides_developer_slide4_bold(inputs)
	return ko_onboarding_slides_developer_slide4_bold(inputs)
});
export { onboarding_slides_developer_slide4_bold as "onboarding.slides.developer.slide4.bold" }