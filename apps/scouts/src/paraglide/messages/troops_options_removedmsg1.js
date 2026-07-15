/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Options_Removedmsg1Inputs */

const en_troops_options_removedmsg1 = /** @type {(inputs: Troops_Options_Removedmsg1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{owner} has been removed from {credential}`)
};

const es_troops_options_removedmsg1 = /** @type {(inputs: Troops_Options_Removedmsg1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{owner} ha sido eliminado de {credential}`)
};

const fr_troops_options_removedmsg1 = /** @type {(inputs: Troops_Options_Removedmsg1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{owner} a été retiré de {credential}`)
};

const ar_troops_options_removedmsg1 = /** @type {(inputs: Troops_Options_Removedmsg1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تمت إزالة {owner} من {credential}`)
};

/**
* | output |
* | --- |
* | "{owner} has been removed from {credential}" |
*
* @param {Troops_Options_Removedmsg1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_options_removedmsg1 = /** @type {((inputs?: Troops_Options_Removedmsg1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Options_Removedmsg1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_options_removedmsg1(inputs)
	if (locale === "es") return es_troops_options_removedmsg1(inputs)
	if (locale === "fr") return fr_troops_options_removedmsg1(inputs)
	return ar_troops_options_removedmsg1(inputs)
});
export { troops_options_removedmsg1 as "troops.options.removedMsg" }