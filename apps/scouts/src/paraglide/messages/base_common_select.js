/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Base_Common_SelectInputs */

const en_base_common_select = /** @type {(inputs: Base_Common_SelectInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select`)
};

const es_base_common_select = /** @type {(inputs: Base_Common_SelectInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar`)
};

const fr_base_common_select = /** @type {(inputs: Base_Common_SelectInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner`)
};

const ar_base_common_select = /** @type {(inputs: Base_Common_SelectInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحديد`)
};

/**
* | output |
* | --- |
* | "Select" |
*
* @param {Base_Common_SelectInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const base_common_select = /** @type {((inputs?: Base_Common_SelectInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Base_Common_SelectInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_base_common_select(inputs)
	if (locale === "es") return es_base_common_select(inputs)
	if (locale === "fr") return fr_base_common_select(inputs)
	return ar_base_common_select(inputs)
});
export { base_common_select as "base.common.select" }