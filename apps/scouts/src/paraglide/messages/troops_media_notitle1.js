/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Media_Notitle1Inputs */

const en_troops_media_notitle1 = /** @type {(inputs: Troops_Media_Notitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No title`)
};

const es_troops_media_notitle1 = /** @type {(inputs: Troops_Media_Notitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin título`)
};

const fr_troops_media_notitle1 = /** @type {(inputs: Troops_Media_Notitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pas de titre`)
};

const ar_troops_media_notitle1 = /** @type {(inputs: Troops_Media_Notitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No title`)
};

/**
* | output |
* | --- |
* | "No title" |
*
* @param {Troops_Media_Notitle1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_media_notitle1 = /** @type {((inputs?: Troops_Media_Notitle1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Media_Notitle1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_media_notitle1(inputs)
	if (locale === "es") return es_troops_media_notitle1(inputs)
	if (locale === "fr") return fr_troops_media_notitle1(inputs)
	return ar_troops_media_notitle1(inputs)
});
export { troops_media_notitle1 as "troops.media.noTitle" }