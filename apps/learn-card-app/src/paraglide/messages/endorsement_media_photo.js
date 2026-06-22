/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Media_PhotoInputs */

const en_endorsement_media_photo = /** @type {(inputs: Endorsement_Media_PhotoInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Photo`)
};

const es_endorsement_media_photo = /** @type {(inputs: Endorsement_Media_PhotoInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Foto`)
};

const fr_endorsement_media_photo = /** @type {(inputs: Endorsement_Media_PhotoInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Photo`)
};

const ar_endorsement_media_photo = /** @type {(inputs: Endorsement_Media_PhotoInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صورة`)
};

/**
* | output |
* | --- |
* | "Photo" |
*
* @param {Endorsement_Media_PhotoInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_media_photo = /** @type {((inputs?: Endorsement_Media_PhotoInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Media_PhotoInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_media_photo(inputs)
	if (locale === "es") return es_endorsement_media_photo(inputs)
	if (locale === "fr") return fr_endorsement_media_photo(inputs)
	return ar_endorsement_media_photo(inputs)
});
export { endorsement_media_photo as "endorsement.media.photo" }