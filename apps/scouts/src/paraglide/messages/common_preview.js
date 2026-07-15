/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_PreviewInputs */

const en_common_preview = /** @type {(inputs: Common_PreviewInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preview`)
};

const es_common_preview = /** @type {(inputs: Common_PreviewInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vista previa`)
};

const fr_common_preview = /** @type {(inputs: Common_PreviewInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aperçu`)
};

const ar_common_preview = /** @type {(inputs: Common_PreviewInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معاينة`)
};

/**
* | output |
* | --- |
* | "Preview" |
*
* @param {Common_PreviewInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_preview = /** @type {((inputs?: Common_PreviewInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_PreviewInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_preview(inputs)
	if (locale === "es") return es_common_preview(inputs)
	if (locale === "fr") return fr_common_preview(inputs)
	return ar_common_preview(inputs)
});
export { common_preview as "common.preview" }