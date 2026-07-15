/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Media_PagesInputs */

const en_troops_media_pages = /** @type {(inputs: Troops_Media_PagesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} page`)
};

const es_troops_media_pages = /** @type {(inputs: Troops_Media_PagesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} página`)
};

const fr_troops_media_pages = /** @type {(inputs: Troops_Media_PagesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} page`)
};

const ar_troops_media_pages = /** @type {(inputs: Troops_Media_PagesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} page`)
};

/**
* | output |
* | --- |
* | "{count} page" |
*
* @param {Troops_Media_PagesInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_media_pages = /** @type {((inputs?: Troops_Media_PagesInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Media_PagesInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_media_pages(inputs)
	if (locale === "es") return es_troops_media_pages(inputs)
	if (locale === "fr") return fr_troops_media_pages(inputs)
	return ar_troops_media_pages(inputs)
});
export { troops_media_pages as "troops.media.pages" }