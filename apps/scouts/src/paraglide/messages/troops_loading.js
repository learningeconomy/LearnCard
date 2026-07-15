/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_LoadingInputs */

const en_troops_loading = /** @type {(inputs: Troops_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading...`)
};

const es_troops_loading = /** @type {(inputs: Troops_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando...`)
};

const fr_troops_loading = /** @type {(inputs: Troops_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement en cours...`)
};

const ar_troops_loading = /** @type {(inputs: Troops_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading...`)
};

/**
* | output |
* | --- |
* | "Loading..." |
*
* @param {Troops_LoadingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_loading = /** @type {((inputs?: Troops_LoadingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_LoadingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_loading(inputs)
	if (locale === "es") return es_troops_loading(inputs)
	if (locale === "fr") return fr_troops_loading(inputs)
	return ar_troops_loading(inputs)
});
export { troops_loading as "troops.loading" }