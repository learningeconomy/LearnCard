/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Slides_Getstarted1Inputs */

const en_onboarding_slides_getstarted1 = /** @type {(inputs: Onboarding_Slides_Getstarted1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Get Started`)
};

const es_onboarding_slides_getstarted1 = /** @type {(inputs: Onboarding_Slides_Getstarted1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Comenzar`)
};

const de_onboarding_slides_getstarted1 = /** @type {(inputs: Onboarding_Slides_Getstarted1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loslegen`)
};

const ar_onboarding_slides_getstarted1 = /** @type {(inputs: Onboarding_Slides_Getstarted1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ابدأ`)
};

const fr_onboarding_slides_getstarted1 = /** @type {(inputs: Onboarding_Slides_Getstarted1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Commencer`)
};

const ko_onboarding_slides_getstarted1 = /** @type {(inputs: Onboarding_Slides_Getstarted1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`시작하기`)
};

/**
* | output |
* | --- |
* | "Get Started" |
*
* @param {Onboarding_Slides_Getstarted1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_getstarted1 = /** @type {((inputs?: Onboarding_Slides_Getstarted1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Getstarted1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_getstarted1(inputs)
	if (locale === "es") return es_onboarding_slides_getstarted1(inputs)
	if (locale === "de") return de_onboarding_slides_getstarted1(inputs)
	if (locale === "ar") return ar_onboarding_slides_getstarted1(inputs)
	if (locale === "fr") return fr_onboarding_slides_getstarted1(inputs)
	return ko_onboarding_slides_getstarted1(inputs)
});
export { onboarding_slides_getstarted1 as "onboarding.slides.getStarted" }