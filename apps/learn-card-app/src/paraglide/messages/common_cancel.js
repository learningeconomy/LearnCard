/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_CancelInputs */

const en_common_cancel = /** @type {(inputs: Common_CancelInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cancel`)
};

const es_common_cancel = /** @type {(inputs: Common_CancelInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cancelar`)
};

const fr_common_cancel = /** @type {(inputs: Common_CancelInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Annuler`)
};

const ar_common_cancel = /** @type {(inputs: Common_CancelInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إلغاء`)
};

/**
* | output |
* | --- |
* | "Cancel" |
*
* @param {Common_CancelInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_cancel = /** @type {((inputs?: Common_CancelInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_CancelInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_cancel(inputs)
	if (locale === "es") return es_common_cancel(inputs)
	if (locale === "fr") return fr_common_cancel(inputs)
	return ar_common_cancel(inputs)
});
export { common_cancel as "common.cancel" }