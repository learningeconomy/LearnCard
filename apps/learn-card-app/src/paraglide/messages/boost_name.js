/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_NameInputs */

const en_boost_name = /** @type {(inputs: Boost_NameInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Name`)
};

const es_boost_name = /** @type {(inputs: Boost_NameInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre`)
};

const de_boost_name = /** @type {(inputs: Boost_NameInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Name`)
};

const ar_boost_name = /** @type {(inputs: Boost_NameInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الاسم`)
};

const fr_boost_name = /** @type {(inputs: Boost_NameInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom`)
};

const ko_boost_name = /** @type {(inputs: Boost_NameInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이름`)
};

/**
* | output |
* | --- |
* | "Name" |
*
* @param {Boost_NameInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const boost_name = /** @type {((inputs?: Boost_NameInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_NameInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_name(inputs)
	if (locale === "es") return es_boost_name(inputs)
	if (locale === "de") return de_boost_name(inputs)
	if (locale === "ar") return ar_boost_name(inputs)
	if (locale === "fr") return fr_boost_name(inputs)
	return ko_boost_name(inputs)
});
export { boost_name as "boost.name" }