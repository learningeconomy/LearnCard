/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Carousel_Getapp1Inputs */

const en_launchpad_carousel_getapp1 = /** @type {(inputs: Launchpad_Carousel_Getapp1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Get App`)
};

const es_launchpad_carousel_getapp1 = /** @type {(inputs: Launchpad_Carousel_Getapp1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtener app`)
};

const de_launchpad_carousel_getapp1 = /** @type {(inputs: Launchpad_Carousel_Getapp1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`App laden`)
};

const ar_launchpad_carousel_getapp1 = /** @type {(inputs: Launchpad_Carousel_Getapp1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الحصول على التطبيق`)
};

const fr_launchpad_carousel_getapp1 = /** @type {(inputs: Launchpad_Carousel_Getapp1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtenir l'app`)
};

const ko_launchpad_carousel_getapp1 = /** @type {(inputs: Launchpad_Carousel_Getapp1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`앱 설치`)
};

/**
* | output |
* | --- |
* | "Get App" |
*
* @param {Launchpad_Carousel_Getapp1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_carousel_getapp1 = /** @type {((inputs?: Launchpad_Carousel_Getapp1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Carousel_Getapp1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_carousel_getapp1(inputs)
	if (locale === "es") return es_launchpad_carousel_getapp1(inputs)
	if (locale === "de") return de_launchpad_carousel_getapp1(inputs)
	if (locale === "ar") return ar_launchpad_carousel_getapp1(inputs)
	if (locale === "fr") return fr_launchpad_carousel_getapp1(inputs)
	return ko_launchpad_carousel_getapp1(inputs)
});
export { launchpad_carousel_getapp1 as "launchpad.carousel.getApp" }