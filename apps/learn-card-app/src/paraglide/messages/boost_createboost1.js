/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Createboost1Inputs */

const en_boost_createboost1 = /** @type {(inputs: Boost_Createboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Boost`)
};

const es_boost_createboost1 = /** @type {(inputs: Boost_Createboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear Boost`)
};

const de_boost_createboost1 = /** @type {(inputs: Boost_Createboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost erstellen`)
};

const ar_boost_createboost1 = /** @type {(inputs: Boost_Createboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء ترقية`)
};

const fr_boost_createboost1 = /** @type {(inputs: Boost_Createboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer un Boost`)
};

const ko_boost_createboost1 = /** @type {(inputs: Boost_Createboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`부스트 만들기`)
};

/**
* | output |
* | --- |
* | "Create Boost" |
*
* @param {Boost_Createboost1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const boost_createboost1 = /** @type {((inputs?: Boost_Createboost1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Createboost1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_createboost1(inputs)
	if (locale === "es") return es_boost_createboost1(inputs)
	if (locale === "de") return de_boost_createboost1(inputs)
	if (locale === "ar") return ar_boost_createboost1(inputs)
	if (locale === "fr") return fr_boost_createboost1(inputs)
	return ko_boost_createboost1(inputs)
});
export { boost_createboost1 as "boost.createBoost" }