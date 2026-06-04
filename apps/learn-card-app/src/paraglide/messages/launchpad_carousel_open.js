/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Carousel_OpenInputs */

const en_launchpad_carousel_open = /** @type {(inputs: Launchpad_Carousel_OpenInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Open`)
};

const es_launchpad_carousel_open = /** @type {(inputs: Launchpad_Carousel_OpenInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abrir`)
};

const de_launchpad_carousel_open = /** @type {(inputs: Launchpad_Carousel_OpenInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Öffnen`)
};

const ar_launchpad_carousel_open = /** @type {(inputs: Launchpad_Carousel_OpenInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فتح`)
};

const fr_launchpad_carousel_open = /** @type {(inputs: Launchpad_Carousel_OpenInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ouvrir`)
};

const ko_launchpad_carousel_open = /** @type {(inputs: Launchpad_Carousel_OpenInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`열기`)
};

/**
* | output |
* | --- |
* | "Open" |
*
* @param {Launchpad_Carousel_OpenInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_carousel_open = /** @type {((inputs?: Launchpad_Carousel_OpenInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Carousel_OpenInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_carousel_open(inputs)
	if (locale === "es") return es_launchpad_carousel_open(inputs)
	if (locale === "de") return de_launchpad_carousel_open(inputs)
	if (locale === "ar") return ar_launchpad_carousel_open(inputs)
	if (locale === "fr") return fr_launchpad_carousel_open(inputs)
	return ko_launchpad_carousel_open(inputs)
});
export { launchpad_carousel_open as "launchpad.carousel.open" }