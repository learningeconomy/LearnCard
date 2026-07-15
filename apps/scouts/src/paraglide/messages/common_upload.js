/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_UploadInputs */

const en_common_upload = /** @type {(inputs: Common_UploadInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Upload`)
};

const es_common_upload = /** @type {(inputs: Common_UploadInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Subir`)
};

const fr_common_upload = /** @type {(inputs: Common_UploadInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Télécharger`)
};

const ar_common_upload = /** @type {(inputs: Common_UploadInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحميل`)
};

/**
* | output |
* | --- |
* | "Upload" |
*
* @param {Common_UploadInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_upload = /** @type {((inputs?: Common_UploadInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_UploadInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_upload(inputs)
	if (locale === "es") return es_common_upload(inputs)
	if (locale === "fr") return fr_common_upload(inputs)
	return ar_common_upload(inputs)
});
export { common_upload as "common.upload" }