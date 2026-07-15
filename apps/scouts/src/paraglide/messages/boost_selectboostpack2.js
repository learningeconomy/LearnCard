/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Selectboostpack2Inputs */

const en_boost_selectboostpack2 = /** @type {(inputs: Boost_Selectboostpack2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select a Boost Pack`)
};

const es_boost_selectboostpack2 = /** @type {(inputs: Boost_Selectboostpack2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar un Pack de Boosts`)
};

const fr_boost_selectboostpack2 = /** @type {(inputs: Boost_Selectboostpack2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner un pack de Boost`)
};

const ar_boost_selectboostpack2 = /** @type {(inputs: Boost_Selectboostpack2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر حزمة تعزيز`)
};

/**
* | output |
* | --- |
* | "Select a Boost Pack" |
*
* @param {Boost_Selectboostpack2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_selectboostpack2 = /** @type {((inputs?: Boost_Selectboostpack2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Selectboostpack2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_selectboostpack2(inputs)
	if (locale === "es") return es_boost_selectboostpack2(inputs)
	if (locale === "fr") return fr_boost_selectboostpack2(inputs)
	return ar_boost_selectboostpack2(inputs)
});
export { boost_selectboostpack2 as "boost.selectBoostPack" }