/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_DeleteInputs */

const en_common_delete = /** @type {(inputs: Common_DeleteInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Delete`)
};

const es_common_delete = /** @type {(inputs: Common_DeleteInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar`)
};

const fr_common_delete = /** @type {(inputs: Common_DeleteInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer`)
};

const ar_common_delete = /** @type {(inputs: Common_DeleteInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حذف`)
};

/**
* | output |
* | --- |
* | "Delete" |
*
* @param {Common_DeleteInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_delete = /** @type {((inputs?: Common_DeleteInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_DeleteInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_delete(inputs)
	if (locale === "es") return es_common_delete(inputs)
	if (locale === "fr") return fr_common_delete(inputs)
	return ar_common_delete(inputs)
});
export { common_delete as "common.delete" }