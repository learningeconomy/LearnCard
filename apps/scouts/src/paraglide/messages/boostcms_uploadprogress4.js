/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ progress: NonNullable<unknown> }} Boostcms_Uploadprogress4Inputs */

const en_boostcms_uploadprogress4 = /** @type {(inputs: Boostcms_Uploadprogress4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.progress}% uploaded`)
};

const es_boostcms_uploadprogress4 = /** @type {(inputs: Boostcms_Uploadprogress4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.progress}% subido`)
};

const fr_boostcms_uploadprogress4 = /** @type {(inputs: Boostcms_Uploadprogress4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.progress}% téléchargé`)
};

const ar_boostcms_uploadprogress4 = /** @type {(inputs: Boostcms_Uploadprogress4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.progress}% uploaded`)
};

/**
* | output |
* | --- |
* | "{progress}% uploaded" |
*
* @param {Boostcms_Uploadprogress4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_uploadprogress4 = /** @type {((inputs: Boostcms_Uploadprogress4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Uploadprogress4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_uploadprogress4(inputs)
	if (locale === "es") return es_boostcms_uploadprogress4(inputs)
	if (locale === "fr") return fr_boostcms_uploadprogress4(inputs)
	return ar_boostcms_uploadprogress4(inputs)
});
export { boostcms_uploadprogress4 as "boostCMS.uploadProgress" }