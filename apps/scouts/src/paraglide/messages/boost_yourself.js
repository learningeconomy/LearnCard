/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_YourselfInputs */

const en_boost_yourself = /** @type {(inputs: Boost_YourselfInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Yourself`)
};

const es_boost_yourself = /** @type {(inputs: Boost_YourselfInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ti Mismo`)
};

const fr_boost_yourself = /** @type {(inputs: Boost_YourselfInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous-même`)
};

const ar_boost_yourself = /** @type {(inputs: Boost_YourselfInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Yourself`)
};

/**
* | output |
* | --- |
* | "Yourself" |
*
* @param {Boost_YourselfInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_yourself = /** @type {((inputs?: Boost_YourselfInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_YourselfInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_yourself(inputs)
	if (locale === "es") return es_boost_yourself(inputs)
	if (locale === "fr") return fr_boost_yourself(inputs)
	return ar_boost_yourself(inputs)
});
export { boost_yourself as "boost.yourself" }