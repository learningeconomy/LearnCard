/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_TitleInputs */

const en_boost_title = /** @type {(inputs: Boost_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boosts`)
};

const es_boost_title = /** @type {(inputs: Boost_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boosts`)
};

const fr_boost_title = /** @type {(inputs: Boost_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boosts`)
};

const ar_boost_title = /** @type {(inputs: Boost_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الترقيات`)
};

/**
* | output |
* | --- |
* | "Boosts" |
*
* @param {Boost_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_title = /** @type {((inputs?: Boost_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_title(inputs)
	if (locale === "es") return es_boost_title(inputs)
	if (locale === "fr") return fr_boost_title(inputs)
	return ar_boost_title(inputs)
});
export { boost_title as "boost.title" }