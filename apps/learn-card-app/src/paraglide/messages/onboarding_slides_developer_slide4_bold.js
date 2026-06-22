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

const fr_onboarding_slides_developer_slide4_bold = /** @type {(inputs: Onboarding_Slides_Developer_Slide4_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Concevez`)
};

const ar_onboarding_slides_developer_slide4_bold = /** @type {(inputs: Onboarding_Slides_Developer_Slide4_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صمّم`)
};

/**
* | output |
* | --- |
* | "Design" |
*
* @param {Onboarding_Slides_Developer_Slide4_BoldInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_developer_slide4_bold = /** @type {((inputs?: Onboarding_Slides_Developer_Slide4_BoldInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Developer_Slide4_BoldInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_developer_slide4_bold(inputs)
	if (locale === "es") return es_onboarding_slides_developer_slide4_bold(inputs)
	if (locale === "fr") return fr_onboarding_slides_developer_slide4_bold(inputs)
	return ar_onboarding_slides_developer_slide4_bold(inputs)
});
export { onboarding_slides_developer_slide4_bold as "onboarding.slides.developer.slide4.bold" }