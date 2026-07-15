/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Selectnetworktype2Inputs */

const en_troops_selectnetworktype2 = /** @type {(inputs: Troops_Selectnetworktype2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select Network Type`)
};

const es_troops_selectnetworktype2 = /** @type {(inputs: Troops_Selectnetworktype2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar Tipo de Red`)
};

const fr_troops_selectnetworktype2 = /** @type {(inputs: Troops_Selectnetworktype2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner le type de réseau`)
};

const ar_troops_selectnetworktype2 = /** @type {(inputs: Troops_Selectnetworktype2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر نوع الشبكة`)
};

/**
* | output |
* | --- |
* | "Select Network Type" |
*
* @param {Troops_Selectnetworktype2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_selectnetworktype2 = /** @type {((inputs?: Troops_Selectnetworktype2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Selectnetworktype2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_selectnetworktype2(inputs)
	if (locale === "es") return es_troops_selectnetworktype2(inputs)
	if (locale === "fr") return fr_troops_selectnetworktype2(inputs)
	return ar_troops_selectnetworktype2(inputs)
});
export { troops_selectnetworktype2 as "troops.selectNetworkType" }