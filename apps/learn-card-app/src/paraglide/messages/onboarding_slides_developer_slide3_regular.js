/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Slides_Developer_Slide3_RegularInputs */

const en_onboarding_slides_developer_slide3_regular = /** @type {(inputs: Onboarding_Slides_Developer_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`your end-to-end data flow`)
};

const es_onboarding_slides_developer_slide3_regular = /** @type {(inputs: Onboarding_Slides_Developer_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`tu flujo de datos de extremo a extremo`)
};

const de_onboarding_slides_developer_slide3_regular = /** @type {(inputs: Onboarding_Slides_Developer_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`deinen End-to-End-Datenfluss`)
};

const ar_onboarding_slides_developer_slide3_regular = /** @type {(inputs: Onboarding_Slides_Developer_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تدفق بياناتك من البداية إلى النهاية`)
};

const fr_onboarding_slides_developer_slide3_regular = /** @type {(inputs: Onboarding_Slides_Developer_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`votre flux de données de bout en bout`)
};

const ko_onboarding_slides_developer_slide3_regular = /** @type {(inputs: Onboarding_Slides_Developer_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`엔드투엔드 데이터 흐름`)
};

/**
* | output |
* | --- |
* | "your end-to-end data flow" |
*
* @param {Onboarding_Slides_Developer_Slide3_RegularInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_developer_slide3_regular = /** @type {((inputs?: Onboarding_Slides_Developer_Slide3_RegularInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Developer_Slide3_RegularInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_developer_slide3_regular(inputs)
	if (locale === "es") return es_onboarding_slides_developer_slide3_regular(inputs)
	if (locale === "de") return de_onboarding_slides_developer_slide3_regular(inputs)
	if (locale === "ar") return ar_onboarding_slides_developer_slide3_regular(inputs)
	if (locale === "fr") return fr_onboarding_slides_developer_slide3_regular(inputs)
	return ko_onboarding_slides_developer_slide3_regular(inputs)
});
export { onboarding_slides_developer_slide3_regular as "onboarding.slides.developer.slide3.regular" }