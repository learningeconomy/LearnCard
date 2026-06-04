/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Slides_Guardian_Slide4_BoldInputs */

const en_onboarding_slides_guardian_slide4_bold = /** @type {(inputs: Onboarding_Slides_Guardian_Slide4_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gain insights`)
};

const es_onboarding_slides_guardian_slide4_bold = /** @type {(inputs: Onboarding_Slides_Guardian_Slide4_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtén información`)
};

const de_onboarding_slides_guardian_slide4_bold = /** @type {(inputs: Onboarding_Slides_Guardian_Slide4_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gewinne Einblicke`)
};

const ar_onboarding_slides_guardian_slide4_bold = /** @type {(inputs: Onboarding_Slides_Guardian_Slide4_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اكتسب رؤى`)
};

const fr_onboarding_slides_guardian_slide4_bold = /** @type {(inputs: Onboarding_Slides_Guardian_Slide4_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtenez des informations`)
};

const ko_onboarding_slides_guardian_slide4_bold = /** @type {(inputs: Onboarding_Slides_Guardian_Slide4_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`통찰력 확보`)
};

/**
* | output |
* | --- |
* | "Gain insights" |
*
* @param {Onboarding_Slides_Guardian_Slide4_BoldInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_guardian_slide4_bold = /** @type {((inputs?: Onboarding_Slides_Guardian_Slide4_BoldInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Guardian_Slide4_BoldInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_guardian_slide4_bold(inputs)
	if (locale === "es") return es_onboarding_slides_guardian_slide4_bold(inputs)
	if (locale === "de") return de_onboarding_slides_guardian_slide4_bold(inputs)
	if (locale === "ar") return ar_onboarding_slides_guardian_slide4_bold(inputs)
	if (locale === "fr") return fr_onboarding_slides_guardian_slide4_bold(inputs)
	return ko_onboarding_slides_guardian_slide4_bold(inputs)
});
export { onboarding_slides_guardian_slide4_bold as "onboarding.slides.guardian.slide4.bold" }