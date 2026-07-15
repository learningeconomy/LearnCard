/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Media_TitleInputs */

const en_troops_media_title = /** @type {(inputs: Troops_Media_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Media Attachments`)
};

const es_troops_media_title = /** @type {(inputs: Troops_Media_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Adjuntos Multimedia`)
};

const fr_troops_media_title = /** @type {(inputs: Troops_Media_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pièces jointes multimédia`)
};

const ar_troops_media_title = /** @type {(inputs: Troops_Media_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Media Attachments`)
};

/**
* | output |
* | --- |
* | "Media Attachments" |
*
* @param {Troops_Media_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_media_title = /** @type {((inputs?: Troops_Media_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Media_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_media_title(inputs)
	if (locale === "es") return es_troops_media_title(inputs)
	if (locale === "fr") return fr_troops_media_title(inputs)
	return ar_troops_media_title(inputs)
});
export { troops_media_title as "troops.media.title" }