/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_IdInputs */

const en_boost_id = /** @type {(inputs: Boost_IdInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID`)
};

const es_boost_id = /** @type {(inputs: Boost_IdInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Identificación`)
};

const fr_boost_id = /** @type {(inputs: Boost_IdInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Identifiant`)
};

const ar_boost_id = /** @type {(inputs: Boost_IdInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هوية`)
};

/**
* | output |
* | --- |
* | "ID" |
*
* @param {Boost_IdInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_id = /** @type {((inputs?: Boost_IdInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_IdInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_id(inputs)
	if (locale === "es") return es_boost_id(inputs)
	if (locale === "fr") return fr_boost_id(inputs)
	return ar_boost_id(inputs)
});
export { boost_id as "boost.id" }