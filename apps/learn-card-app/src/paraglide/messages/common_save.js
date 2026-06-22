/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_SaveInputs */

const en_common_save = /** @type {(inputs: Common_SaveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save`)
};

const es_common_save = /** @type {(inputs: Common_SaveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardar`)
};

const fr_common_save = /** @type {(inputs: Common_SaveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrer`)
};

const ar_common_save = /** @type {(inputs: Common_SaveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حفظ`)
};

/**
* | output |
* | --- |
* | "Save" |
*
* @param {Common_SaveInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_save = /** @type {((inputs?: Common_SaveInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_SaveInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_save(inputs)
	if (locale === "es") return es_common_save(inputs)
	if (locale === "fr") return fr_common_save(inputs)
	return ar_common_save(inputs)
});
export { common_save as "common.save" }