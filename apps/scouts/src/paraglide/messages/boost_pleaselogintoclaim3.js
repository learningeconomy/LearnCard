/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Pleaselogintoclaim3Inputs */

const en_boost_pleaselogintoclaim3 = /** @type {(inputs: Boost_Pleaselogintoclaim3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please login to claim your boost/credential.`)
};

const es_boost_pleaselogintoclaim3 = /** @type {(inputs: Boost_Pleaselogintoclaim3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inicia sesión para reclamar tu boost/credencial.`)
};

const fr_boost_pleaselogintoclaim3 = /** @type {(inputs: Boost_Pleaselogintoclaim3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez vous connecter pour réclamer votre boost/justificatif.`)
};

const ar_boost_pleaselogintoclaim3 = /** @type {(inputs: Boost_Pleaselogintoclaim3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please login to claim your boost/credential.`)
};

/**
* | output |
* | --- |
* | "Please login to claim your boost/credential." |
*
* @param {Boost_Pleaselogintoclaim3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_pleaselogintoclaim3 = /** @type {((inputs?: Boost_Pleaselogintoclaim3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Pleaselogintoclaim3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_pleaselogintoclaim3(inputs)
	if (locale === "es") return es_boost_pleaselogintoclaim3(inputs)
	if (locale === "fr") return fr_boost_pleaselogintoclaim3(inputs)
	return ar_boost_pleaselogintoclaim3(inputs)
});
export { boost_pleaselogintoclaim3 as "boost.pleaseLoginToClaim" }