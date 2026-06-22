/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Slides_Developer_Slide2_RegularInputs */

const en_onboarding_slides_developer_slide2_regular = /** @type {(inputs: Onboarding_Slides_Developer_Slide2_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`with schools, applications, and data sources`)
};

const es_onboarding_slides_developer_slide2_regular = /** @type {(inputs: Onboarding_Slides_Developer_Slide2_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`con escuelas, aplicaciones y fuentes de datos`)
};

const fr_onboarding_slides_developer_slide2_regular = /** @type {(inputs: Onboarding_Slides_Developer_Slide2_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`avec les écoles, applications et sources de données`)
};

const ar_onboarding_slides_developer_slide2_regular = /** @type {(inputs: Onboarding_Slides_Developer_Slide2_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مع المدارس والتطبيقات ومصادر البيانات`)
};

/**
* | output |
* | --- |
* | "with schools, applications, and data sources" |
*
* @param {Onboarding_Slides_Developer_Slide2_RegularInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_developer_slide2_regular = /** @type {((inputs?: Onboarding_Slides_Developer_Slide2_RegularInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Developer_Slide2_RegularInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_developer_slide2_regular(inputs)
	if (locale === "es") return es_onboarding_slides_developer_slide2_regular(inputs)
	if (locale === "fr") return fr_onboarding_slides_developer_slide2_regular(inputs)
	return ar_onboarding_slides_developer_slide2_regular(inputs)
});
export { onboarding_slides_developer_slide2_regular as "onboarding.slides.developer.slide2.regular" }