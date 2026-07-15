/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_LoadingInputs */

const en_common_loading = /** @type {(inputs: Common_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading...`)
};

const es_common_loading = /** @type {(inputs: Common_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando...`)
};

const fr_common_loading = /** @type {(inputs: Common_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement...`)
};

const ar_common_loading = /** @type {(inputs: Common_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري التحميل...`)
};

/**
* | output |
* | --- |
* | "Loading..." |
*
* @param {Common_LoadingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_loading = /** @type {((inputs?: Common_LoadingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_LoadingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_loading(inputs)
	if (locale === "es") return es_common_loading(inputs)
	if (locale === "fr") return fr_common_loading(inputs)
	return ar_common_loading(inputs)
});
export { common_loading as "common.loading" }