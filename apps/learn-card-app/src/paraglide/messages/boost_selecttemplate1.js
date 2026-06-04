/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Selecttemplate1Inputs */

const en_boost_selecttemplate1 = /** @type {(inputs: Boost_Selecttemplate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select a template`)
};

const es_boost_selecttemplate1 = /** @type {(inputs: Boost_Selecttemplate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar plantilla`)
};

const de_boost_selecttemplate1 = /** @type {(inputs: Boost_Selecttemplate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vorlage auswählen`)
};

const ar_boost_selecttemplate1 = /** @type {(inputs: Boost_Selecttemplate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختيار قالب`)
};

const fr_boost_selecttemplate1 = /** @type {(inputs: Boost_Selecttemplate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner un modèle`)
};

const ko_boost_selecttemplate1 = /** @type {(inputs: Boost_Selecttemplate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`템플릿 선택`)
};

/**
* | output |
* | --- |
* | "Select a template" |
*
* @param {Boost_Selecttemplate1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const boost_selecttemplate1 = /** @type {((inputs?: Boost_Selecttemplate1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Selecttemplate1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_selecttemplate1(inputs)
	if (locale === "es") return es_boost_selecttemplate1(inputs)
	if (locale === "de") return de_boost_selecttemplate1(inputs)
	if (locale === "ar") return ar_boost_selecttemplate1(inputs)
	if (locale === "fr") return fr_boost_selecttemplate1(inputs)
	return ko_boost_selecttemplate1(inputs)
});
export { boost_selecttemplate1 as "boost.selectTemplate" }