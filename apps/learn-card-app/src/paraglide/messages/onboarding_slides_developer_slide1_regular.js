/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Slides_Developer_Slide1_RegularInputs */

const en_onboarding_slides_developer_slide1_regular = /** @type {(inputs: Onboarding_Slides_Developer_Slide1_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`issuers, consent protocols and connected systems`)
};

const es_onboarding_slides_developer_slide1_regular = /** @type {(inputs: Onboarding_Slides_Developer_Slide1_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`emisores, protocolos de consentimiento y sistemas conectados`)
};

const de_onboarding_slides_developer_slide1_regular = /** @type {(inputs: Onboarding_Slides_Developer_Slide1_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aussteller, Einwilligungsprotokolle und verbundene Systeme`)
};

const ar_onboarding_slides_developer_slide1_regular = /** @type {(inputs: Onboarding_Slides_Developer_Slide1_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المُصدرين وبروتوكولات الموافقة والأنظمة المتصلة`)
};

const fr_onboarding_slides_developer_slide1_regular = /** @type {(inputs: Onboarding_Slides_Developer_Slide1_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`les émetteurs, protocoles de consentement et systèmes connectés`)
};

const ko_onboarding_slides_developer_slide1_regular = /** @type {(inputs: Onboarding_Slides_Developer_Slide1_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`발급자, 동의 프로토콜 및 연결된 시스템`)
};

/**
* | output |
* | --- |
* | "issuers, consent protocols and connected systems" |
*
* @param {Onboarding_Slides_Developer_Slide1_RegularInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_developer_slide1_regular = /** @type {((inputs?: Onboarding_Slides_Developer_Slide1_RegularInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Developer_Slide1_RegularInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_developer_slide1_regular(inputs)
	if (locale === "es") return es_onboarding_slides_developer_slide1_regular(inputs)
	if (locale === "de") return de_onboarding_slides_developer_slide1_regular(inputs)
	if (locale === "ar") return ar_onboarding_slides_developer_slide1_regular(inputs)
	if (locale === "fr") return fr_onboarding_slides_developer_slide1_regular(inputs)
	return ko_onboarding_slides_developer_slide1_regular(inputs)
});
export { onboarding_slides_developer_slide1_regular as "onboarding.slides.developer.slide1.regular" }