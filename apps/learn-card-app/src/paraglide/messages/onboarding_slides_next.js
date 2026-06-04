/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Slides_NextInputs */

const en_onboarding_slides_next = /** @type {(inputs: Onboarding_Slides_NextInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Next`)
};

const es_onboarding_slides_next = /** @type {(inputs: Onboarding_Slides_NextInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Siguiente`)
};

const de_onboarding_slides_next = /** @type {(inputs: Onboarding_Slides_NextInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Weiter`)
};

const ar_onboarding_slides_next = /** @type {(inputs: Onboarding_Slides_NextInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التالي`)
};

const fr_onboarding_slides_next = /** @type {(inputs: Onboarding_Slides_NextInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suivant`)
};

const ko_onboarding_slides_next = /** @type {(inputs: Onboarding_Slides_NextInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`다음`)
};

/**
* | output |
* | --- |
* | "Next" |
*
* @param {Onboarding_Slides_NextInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_next = /** @type {((inputs?: Onboarding_Slides_NextInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_NextInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_next(inputs)
	if (locale === "es") return es_onboarding_slides_next(inputs)
	if (locale === "de") return de_onboarding_slides_next(inputs)
	if (locale === "ar") return ar_onboarding_slides_next(inputs)
	if (locale === "fr") return fr_onboarding_slides_next(inputs)
	return ko_onboarding_slides_next(inputs)
});
export { onboarding_slides_next as "onboarding.slides.next" }