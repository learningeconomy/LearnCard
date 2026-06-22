/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Shortboost_Generatelink2Inputs */

const en_boost_shortboost_generatelink2 = /** @type {(inputs: Boost_Shortboost_Generatelink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generate Link`)
};

const es_boost_shortboost_generatelink2 = /** @type {(inputs: Boost_Shortboost_Generatelink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generar enlace`)
};

const fr_boost_shortboost_generatelink2 = /** @type {(inputs: Boost_Shortboost_Generatelink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Générer un lien`)
};

const ar_boost_shortboost_generatelink2 = /** @type {(inputs: Boost_Shortboost_Generatelink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء رابط`)
};

/**
* | output |
* | --- |
* | "Generate Link" |
*
* @param {Boost_Shortboost_Generatelink2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_shortboost_generatelink2 = /** @type {((inputs?: Boost_Shortboost_Generatelink2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Shortboost_Generatelink2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_shortboost_generatelink2(inputs)
	if (locale === "es") return es_boost_shortboost_generatelink2(inputs)
	if (locale === "fr") return fr_boost_shortboost_generatelink2(inputs)
	return ar_boost_shortboost_generatelink2(inputs)
});
export { boost_shortboost_generatelink2 as "boost.shortBoost.generateLink" }