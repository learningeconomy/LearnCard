/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Options_Removefailed1Inputs */

const en_troops_options_removefailed1 = /** @type {(inputs: Troops_Options_Removefailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to remove {owner}. Please try again.`)
};

const es_troops_options_removefailed1 = /** @type {(inputs: Troops_Options_Removefailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al eliminar a {owner}. Por favor inténtalo de nuevo.`)
};

const fr_troops_options_removefailed1 = /** @type {(inputs: Troops_Options_Removefailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec du retrait de {owner}. Veuillez réessayer.`)
};

const ar_troops_options_removefailed1 = /** @type {(inputs: Troops_Options_Removefailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to remove {owner}. Please try again.`)
};

/**
* | output |
* | --- |
* | "Failed to remove {owner}. Please try again." |
*
* @param {Troops_Options_Removefailed1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_options_removefailed1 = /** @type {((inputs?: Troops_Options_Removefailed1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Options_Removefailed1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_options_removefailed1(inputs)
	if (locale === "es") return es_troops_options_removefailed1(inputs)
	if (locale === "fr") return fr_troops_options_removefailed1(inputs)
	return ar_troops_options_removefailed1(inputs)
});
export { troops_options_removefailed1 as "troops.options.removeFailed" }