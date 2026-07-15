/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Copyjson1Inputs */

const en_boost_copyjson1 = /** @type {(inputs: Boost_Copyjson1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy JSON`)
};

const es_boost_copyjson1 = /** @type {(inputs: Boost_Copyjson1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copiar JSON`)
};

const fr_boost_copyjson1 = /** @type {(inputs: Boost_Copyjson1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copier le JSON`)
};

const ar_boost_copyjson1 = /** @type {(inputs: Boost_Copyjson1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy JSON`)
};

/**
* | output |
* | --- |
* | "Copy JSON" |
*
* @param {Boost_Copyjson1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_copyjson1 = /** @type {((inputs?: Boost_Copyjson1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Copyjson1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_copyjson1(inputs)
	if (locale === "es") return es_boost_copyjson1(inputs)
	if (locale === "fr") return fr_boost_copyjson1(inputs)
	return ar_boost_copyjson1(inputs)
});
export { boost_copyjson1 as "boost.copyJson" }