/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Media_DocumentInputs */

const en_endorsement_media_document = /** @type {(inputs: Endorsement_Media_DocumentInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Document`)
};

const es_endorsement_media_document = /** @type {(inputs: Endorsement_Media_DocumentInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Documento`)
};

const fr_endorsement_media_document = /** @type {(inputs: Endorsement_Media_DocumentInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Document`)
};

const ar_endorsement_media_document = /** @type {(inputs: Endorsement_Media_DocumentInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مستند`)
};

/**
* | output |
* | --- |
* | "Document" |
*
* @param {Endorsement_Media_DocumentInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_media_document = /** @type {((inputs?: Endorsement_Media_DocumentInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Media_DocumentInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_media_document(inputs)
	if (locale === "es") return es_endorsement_media_document(inputs)
	if (locale === "fr") return fr_endorsement_media_document(inputs)
	return ar_endorsement_media_document(inputs)
});
export { endorsement_media_document as "endorsement.media.document" }