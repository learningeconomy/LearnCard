/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Editboost1Inputs */

const en_boost_editboost1 = /** @type {(inputs: Boost_Editboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit Boost`)
};

const es_boost_editboost1 = /** @type {(inputs: Boost_Editboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar Boost`)
};

const de_boost_editboost1 = /** @type {(inputs: Boost_Editboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost bearbeiten`)
};

const ar_boost_editboost1 = /** @type {(inputs: Boost_Editboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعديل الترقية`)
};

const fr_boost_editboost1 = /** @type {(inputs: Boost_Editboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier le Boost`)
};

const ko_boost_editboost1 = /** @type {(inputs: Boost_Editboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`부스트 편집`)
};

/**
* | output |
* | --- |
* | "Edit Boost" |
*
* @param {Boost_Editboost1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const boost_editboost1 = /** @type {((inputs?: Boost_Editboost1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Editboost1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_editboost1(inputs)
	if (locale === "es") return es_boost_editboost1(inputs)
	if (locale === "de") return de_boost_editboost1(inputs)
	if (locale === "ar") return ar_boost_editboost1(inputs)
	if (locale === "fr") return fr_boost_editboost1(inputs)
	return ko_boost_editboost1(inputs)
});
export { boost_editboost1 as "boost.editBoost" }