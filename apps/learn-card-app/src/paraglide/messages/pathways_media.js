/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Pathways_MediaInputs */

const en_pathways_media = /** @type {(inputs: Pathways_MediaInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Media`)
};

const es_pathways_media = /** @type {(inputs: Pathways_MediaInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Medios`)
};

const de_pathways_media = /** @type {(inputs: Pathways_MediaInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Medien`)
};

const ar_pathways_media = /** @type {(inputs: Pathways_MediaInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الوسائط`)
};

const fr_pathways_media = /** @type {(inputs: Pathways_MediaInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Médias`)
};

const ko_pathways_media = /** @type {(inputs: Pathways_MediaInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`미디어`)
};

/**
* | output |
* | --- |
* | "Media" |
*
* @param {Pathways_MediaInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const pathways_media = /** @type {((inputs?: Pathways_MediaInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_MediaInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_media(inputs)
	if (locale === "es") return es_pathways_media(inputs)
	if (locale === "de") return de_pathways_media(inputs)
	if (locale === "ar") return ar_pathways_media(inputs)
	if (locale === "fr") return fr_pathways_media(inputs)
	return ko_pathways_media(inputs)
});
export { pathways_media as "pathways.media" }