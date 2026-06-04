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

const de_boost_id = /** @type {(inputs: Boost_IdInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ausweis`)
};

const ar_boost_id = /** @type {(inputs: Boost_IdInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هوية`)
};

const fr_boost_id = /** @type {(inputs: Boost_IdInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Identifiant`)
};

const ko_boost_id = /** @type {(inputs: Boost_IdInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`신분증`)
};

/**
* | output |
* | --- |
* | "ID" |
*
* @param {Boost_IdInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const boost_id = /** @type {((inputs?: Boost_IdInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_IdInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_id(inputs)
	if (locale === "es") return es_boost_id(inputs)
	if (locale === "de") return de_boost_id(inputs)
	if (locale === "ar") return ar_boost_id(inputs)
	if (locale === "fr") return fr_boost_id(inputs)
	return ko_boost_id(inputs)
});
export { boost_id as "boost.id" }