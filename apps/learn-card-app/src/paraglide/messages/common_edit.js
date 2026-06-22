/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_EditInputs */

const en_common_edit = /** @type {(inputs: Common_EditInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit`)
};

const es_common_edit = /** @type {(inputs: Common_EditInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar`)
};

const fr_common_edit = /** @type {(inputs: Common_EditInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier`)
};

const ar_common_edit = /** @type {(inputs: Common_EditInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعديل`)
};

/**
* | output |
* | --- |
* | "Edit" |
*
* @param {Common_EditInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_edit = /** @type {((inputs?: Common_EditInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_EditInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_edit(inputs)
	if (locale === "es") return es_common_edit(inputs)
	if (locale === "fr") return fr_common_edit(inputs)
	return ar_common_edit(inputs)
});
export { common_edit as "common.edit" }