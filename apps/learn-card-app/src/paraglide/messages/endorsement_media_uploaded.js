/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Endorsement_Media_UploadedInputs */

const en_endorsement_media_uploaded = /** @type {(inputs: Endorsement_Media_UploadedInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count}% uploaded`)
};

const es_endorsement_media_uploaded = /** @type {(inputs: Endorsement_Media_UploadedInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count}% cargado`)
};

const fr_endorsement_media_uploaded = /** @type {(inputs: Endorsement_Media_UploadedInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count}% téléversé`)
};

const ar_endorsement_media_uploaded = /** @type {(inputs: Endorsement_Media_UploadedInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`تم رفع ${i?.count}%`)
};

/**
* | output |
* | --- |
* | "{count}% uploaded" |
*
* @param {Endorsement_Media_UploadedInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_media_uploaded = /** @type {((inputs: Endorsement_Media_UploadedInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Media_UploadedInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_media_uploaded(inputs)
	if (locale === "es") return es_endorsement_media_uploaded(inputs)
	if (locale === "fr") return fr_endorsement_media_uploaded(inputs)
	return ar_endorsement_media_uploaded(inputs)
});
export { endorsement_media_uploaded as "endorsement.media.uploaded" }