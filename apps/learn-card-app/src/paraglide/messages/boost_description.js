/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_DescriptionInputs */

const en_boost_description = /** @type {(inputs: Boost_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Description`)
};

const es_boost_description = /** @type {(inputs: Boost_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Descripción`)
};

const fr_boost_description = /** @type {(inputs: Boost_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Description`)
};

const ar_boost_description = /** @type {(inputs: Boost_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الوصف`)
};

/**
* | output |
* | --- |
* | "Description" |
*
* @param {Boost_DescriptionInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_description = /** @type {((inputs?: Boost_DescriptionInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_DescriptionInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_description(inputs)
	if (locale === "es") return es_boost_description(inputs)
	if (locale === "fr") return fr_boost_description(inputs)
	return ar_boost_description(inputs)
});
export { boost_description as "boost.description" }