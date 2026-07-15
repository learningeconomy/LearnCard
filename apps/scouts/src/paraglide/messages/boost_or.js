/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_OrInputs */

const en_boost_or = /** @type {(inputs: Boost_OrInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`or`)
};

const es_boost_or = /** @type {(inputs: Boost_OrInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`o`)
};

const fr_boost_or = /** @type {(inputs: Boost_OrInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ou`)
};

const ar_boost_or = /** @type {(inputs: Boost_OrInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أو`)
};

/**
* | output |
* | --- |
* | "or" |
*
* @param {Boost_OrInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_or = /** @type {((inputs?: Boost_OrInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_OrInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_or(inputs)
	if (locale === "es") return es_boost_or(inputs)
	if (locale === "fr") return fr_boost_or(inputs)
	return ar_boost_or(inputs)
});
export { boost_or as "boost.or" }