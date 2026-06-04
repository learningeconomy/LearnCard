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

const de_boost_title = /** @type {(inputs: Boost_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boosts`)
};

const ar_boost_title = /** @type {(inputs: Boost_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الترقيات`)
};

const fr_boost_title = /** @type {(inputs: Boost_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boosts`)
};

const ko_boost_title = /** @type {(inputs: Boost_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`부스트`)
};

/**
* | output |
* | --- |
* | "Boosts" |
*
* @param {Boost_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const boost_title = /** @type {((inputs?: Boost_TitleInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_TitleInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_title(inputs)
	if (locale === "es") return es_boost_title(inputs)
	if (locale === "de") return de_boost_title(inputs)
	if (locale === "ar") return ar_boost_title(inputs)
	if (locale === "fr") return fr_boost_title(inputs)
	return ko_boost_title(inputs)
});
export { boost_title as "boost.title" }