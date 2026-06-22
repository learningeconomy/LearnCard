/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Media_LinkInputs */

const en_endorsement_media_link = /** @type {(inputs: Endorsement_Media_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Link`)
};

const es_endorsement_media_link = /** @type {(inputs: Endorsement_Media_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enlace`)
};

const fr_endorsement_media_link = /** @type {(inputs: Endorsement_Media_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lien`)
};

const ar_endorsement_media_link = /** @type {(inputs: Endorsement_Media_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رابط`)
};

/**
* | output |
* | --- |
* | "Link" |
*
* @param {Endorsement_Media_LinkInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_media_link = /** @type {((inputs?: Endorsement_Media_LinkInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Media_LinkInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_media_link(inputs)
	if (locale === "es") return es_endorsement_media_link(inputs)
	if (locale === "fr") return fr_endorsement_media_link(inputs)
	return ar_endorsement_media_link(inputs)
});
export { endorsement_media_link as "endorsement.media.link" }