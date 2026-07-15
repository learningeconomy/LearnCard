/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_AddInputs */

const en_common_add = /** @type {(inputs: Common_AddInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add`)
};

const es_common_add = /** @type {(inputs: Common_AddInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir`)
};

const fr_common_add = /** @type {(inputs: Common_AddInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter`)
};

const ar_common_add = /** @type {(inputs: Common_AddInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة`)
};

/**
* | output |
* | --- |
* | "Add" |
*
* @param {Common_AddInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_add = /** @type {((inputs?: Common_AddInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_AddInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_add(inputs)
	if (locale === "es") return es_common_add(inputs)
	if (locale === "fr") return fr_common_add(inputs)
	return ar_common_add(inputs)
});
export { common_add as "common.add" }