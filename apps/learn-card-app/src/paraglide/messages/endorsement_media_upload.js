/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Media_UploadInputs */

const en_endorsement_media_upload = /** @type {(inputs: Endorsement_Media_UploadInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Upload`)
};

const es_endorsement_media_upload = /** @type {(inputs: Endorsement_Media_UploadInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Subir`)
};

const fr_endorsement_media_upload = /** @type {(inputs: Endorsement_Media_UploadInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Téléverser`)
};

const ar_endorsement_media_upload = /** @type {(inputs: Endorsement_Media_UploadInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رفع`)
};

/**
* | output |
* | --- |
* | "Upload" |
*
* @param {Endorsement_Media_UploadInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_media_upload = /** @type {((inputs?: Endorsement_Media_UploadInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Media_UploadInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_media_upload(inputs)
	if (locale === "es") return es_endorsement_media_upload(inputs)
	if (locale === "fr") return fr_endorsement_media_upload(inputs)
	return ar_endorsement_media_upload(inputs)
});
export { endorsement_media_upload as "endorsement.media.upload" }