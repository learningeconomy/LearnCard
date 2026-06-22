/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Media_UploadingInputs */

const en_endorsement_media_uploading = /** @type {(inputs: Endorsement_Media_UploadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Uploading...`)
};

const es_endorsement_media_uploading = /** @type {(inputs: Endorsement_Media_UploadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Subiendo...`)
};

const fr_endorsement_media_uploading = /** @type {(inputs: Endorsement_Media_UploadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Téléversement...`)
};

const ar_endorsement_media_uploading = /** @type {(inputs: Endorsement_Media_UploadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ الرفع...`)
};

/**
* | output |
* | --- |
* | "Uploading..." |
*
* @param {Endorsement_Media_UploadingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_media_uploading = /** @type {((inputs?: Endorsement_Media_UploadingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Media_UploadingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_media_uploading(inputs)
	if (locale === "es") return es_endorsement_media_uploading(inputs)
	if (locale === "fr") return fr_endorsement_media_uploading(inputs)
	return ar_endorsement_media_uploading(inputs)
});
export { endorsement_media_uploading as "endorsement.media.uploading" }