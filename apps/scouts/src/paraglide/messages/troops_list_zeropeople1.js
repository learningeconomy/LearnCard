/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_List_Zeropeople1Inputs */

const en_troops_list_zeropeople1 = /** @type {(inputs: Troops_List_Zeropeople1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`0 People`)
};

const es_troops_list_zeropeople1 = /** @type {(inputs: Troops_List_Zeropeople1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`0 Personas`)
};

const fr_troops_list_zeropeople1 = /** @type {(inputs: Troops_List_Zeropeople1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`0 personne`)
};

const ar_troops_list_zeropeople1 = /** @type {(inputs: Troops_List_Zeropeople1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`0 شخص`)
};

/**
* | output |
* | --- |
* | "0 People" |
*
* @param {Troops_List_Zeropeople1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_list_zeropeople1 = /** @type {((inputs?: Troops_List_Zeropeople1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_List_Zeropeople1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_list_zeropeople1(inputs)
	if (locale === "es") return es_troops_list_zeropeople1(inputs)
	if (locale === "fr") return fr_troops_list_zeropeople1(inputs)
	return ar_troops_list_zeropeople1(inputs)
});
export { troops_list_zeropeople1 as "troops.list.zeroPeople" }