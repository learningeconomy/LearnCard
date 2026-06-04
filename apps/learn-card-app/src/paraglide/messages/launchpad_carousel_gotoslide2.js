/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ number: NonNullable<unknown> }} Launchpad_Carousel_Gotoslide2Inputs */

const en_launchpad_carousel_gotoslide2 = /** @type {(inputs: Launchpad_Carousel_Gotoslide2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Go to slide ${i?.number}`)
};

const es_launchpad_carousel_gotoslide2 = /** @type {(inputs: Launchpad_Carousel_Gotoslide2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Ir a la diapositiva ${i?.number}`)
};

const de_launchpad_carousel_gotoslide2 = /** @type {(inputs: Launchpad_Carousel_Gotoslide2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Gehe zu Folie ${i?.number}`)
};

const ar_launchpad_carousel_gotoslide2 = /** @type {(inputs: Launchpad_Carousel_Gotoslide2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`الانتقال إلى الشريحة ${i?.number}`)
};

const fr_launchpad_carousel_gotoslide2 = /** @type {(inputs: Launchpad_Carousel_Gotoslide2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Aller à la diapositive ${i?.number}`)
};

const ko_launchpad_carousel_gotoslide2 = /** @type {(inputs: Launchpad_Carousel_Gotoslide2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`슬라이드 ${i?.number}(으)로 이동`)
};

/**
* | output |
* | --- |
* | "Go to slide {number}" |
*
* @param {Launchpad_Carousel_Gotoslide2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_carousel_gotoslide2 = /** @type {((inputs: Launchpad_Carousel_Gotoslide2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Carousel_Gotoslide2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_carousel_gotoslide2(inputs)
	if (locale === "es") return es_launchpad_carousel_gotoslide2(inputs)
	if (locale === "de") return de_launchpad_carousel_gotoslide2(inputs)
	if (locale === "ar") return ar_launchpad_carousel_gotoslide2(inputs)
	if (locale === "fr") return fr_launchpad_carousel_gotoslide2(inputs)
	return ko_launchpad_carousel_gotoslide2(inputs)
});
export { launchpad_carousel_gotoslide2 as "launchpad.carousel.goToSlide" }