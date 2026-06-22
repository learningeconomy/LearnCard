/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Slides_Developer_Slide4_RegularInputs */

const en_onboarding_slides_developer_slide4_regular = /** @type {(inputs: Onboarding_Slides_Developer_Slide4_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`custom, modular user experiences`)
};

const es_onboarding_slides_developer_slide4_regular = /** @type {(inputs: Onboarding_Slides_Developer_Slide4_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`experiencias de usuario modulares y personalizadas`)
};

const fr_onboarding_slides_developer_slide4_regular = /** @type {(inputs: Onboarding_Slides_Developer_Slide4_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`des expériences utilisateur modulaires et personnalisées`)
};

const ar_onboarding_slides_developer_slide4_regular = /** @type {(inputs: Onboarding_Slides_Developer_Slide4_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تجارب مستخدم مخصصة ونمطية`)
};

/**
* | output |
* | --- |
* | "custom, modular user experiences" |
*
* @param {Onboarding_Slides_Developer_Slide4_RegularInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_developer_slide4_regular = /** @type {((inputs?: Onboarding_Slides_Developer_Slide4_RegularInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Developer_Slide4_RegularInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_developer_slide4_regular(inputs)
	if (locale === "es") return es_onboarding_slides_developer_slide4_regular(inputs)
	if (locale === "fr") return fr_onboarding_slides_developer_slide4_regular(inputs)
	return ar_onboarding_slides_developer_slide4_regular(inputs)
});
export { onboarding_slides_developer_slide4_regular as "onboarding.slides.developer.slide4.regular" }