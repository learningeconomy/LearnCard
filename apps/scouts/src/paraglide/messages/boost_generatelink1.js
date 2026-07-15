/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Generatelink1Inputs */

const en_boost_generatelink1 = /** @type {(inputs: Boost_Generatelink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generate Link`)
};

const es_boost_generatelink1 = /** @type {(inputs: Boost_Generatelink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generar Enlace`)
};

const fr_boost_generatelink1 = /** @type {(inputs: Boost_Generatelink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Générer un lien`)
};

const ar_boost_generatelink1 = /** @type {(inputs: Boost_Generatelink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generate Link`)
};

/**
* | output |
* | --- |
* | "Generate Link" |
*
* @param {Boost_Generatelink1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_generatelink1 = /** @type {((inputs?: Boost_Generatelink1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Generatelink1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_generatelink1(inputs)
	if (locale === "es") return es_boost_generatelink1(inputs)
	if (locale === "fr") return fr_boost_generatelink1(inputs)
	return ar_boost_generatelink1(inputs)
});
export { boost_generatelink1 as "boost.generateLink" }