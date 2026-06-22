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

const fr_onboarding_slides_developer_slide3_bold = /** @type {(inputs: Onboarding_Slides_Developer_Slide3_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gérez`)
};

const ar_onboarding_slides_developer_slide3_bold = /** @type {(inputs: Onboarding_Slides_Developer_Slide3_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أدر`)
};

/**
* | output |
* | --- |
* | "Manage" |
*
* @param {Onboarding_Slides_Developer_Slide3_BoldInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_developer_slide3_bold = /** @type {((inputs?: Onboarding_Slides_Developer_Slide3_BoldInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Developer_Slide3_BoldInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_developer_slide3_bold(inputs)
	if (locale === "es") return es_onboarding_slides_developer_slide3_bold(inputs)
	if (locale === "fr") return fr_onboarding_slides_developer_slide3_bold(inputs)
	return ar_onboarding_slides_developer_slide3_bold(inputs)
});
export { onboarding_slides_developer_slide3_bold as "onboarding.slides.developer.slide3.bold" }