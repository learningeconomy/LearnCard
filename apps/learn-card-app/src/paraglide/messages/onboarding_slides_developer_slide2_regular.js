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

const de_onboarding_slides_developer_slide2_regular = /** @type {(inputs: Onboarding_Slides_Developer_Slide2_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`mit Schulen, Anwendungen und Datenquellen`)
};

const ar_onboarding_slides_developer_slide2_regular = /** @type {(inputs: Onboarding_Slides_Developer_Slide2_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مع المدارس والتطبيقات ومصادر البيانات`)
};

const fr_onboarding_slides_developer_slide2_regular = /** @type {(inputs: Onboarding_Slides_Developer_Slide2_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`avec les écoles, applications et sources de données`)
};

const ko_onboarding_slides_developer_slide2_regular = /** @type {(inputs: Onboarding_Slides_Developer_Slide2_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`학교, 애플리케이션 및 데이터 소스와`)
};

/**
* | output |
* | --- |
* | "with schools, applications, and data sources" |
*
* @param {Onboarding_Slides_Developer_Slide2_RegularInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_developer_slide2_regular = /** @type {((inputs?: Onboarding_Slides_Developer_Slide2_RegularInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Developer_Slide2_RegularInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_developer_slide2_regular(inputs)
	if (locale === "es") return es_onboarding_slides_developer_slide2_regular(inputs)
	if (locale === "de") return de_onboarding_slides_developer_slide2_regular(inputs)
	if (locale === "ar") return ar_onboarding_slides_developer_slide2_regular(inputs)
	if (locale === "fr") return fr_onboarding_slides_developer_slide2_regular(inputs)
	return ko_onboarding_slides_developer_slide2_regular(inputs)
});
export { onboarding_slides_developer_slide2_regular as "onboarding.slides.developer.slide2.regular" }