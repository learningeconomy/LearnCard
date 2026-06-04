/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Searchrecipients1Inputs */

const en_boost_searchrecipients1 = /** @type {(inputs: Boost_Searchrecipients1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search recipients...`)
};

const es_boost_searchrecipients1 = /** @type {(inputs: Boost_Searchrecipients1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscar destinatarios...`)
};

const de_boost_searchrecipients1 = /** @type {(inputs: Boost_Searchrecipients1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Empfänger suchen...`)
};

const ar_boost_searchrecipients1 = /** @type {(inputs: Boost_Searchrecipients1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`البحث عن مستلمين...`)
};

const fr_boost_searchrecipients1 = /** @type {(inputs: Boost_Searchrecipients1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechercher des destinataires...`)
};

const ko_boost_searchrecipients1 = /** @type {(inputs: Boost_Searchrecipients1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`수령인 검색...`)
};

/**
* | output |
* | --- |
* | "Search recipients..." |
*
* @param {Boost_Searchrecipients1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const boost_searchrecipients1 = /** @type {((inputs?: Boost_Searchrecipients1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Searchrecipients1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_searchrecipients1(inputs)
	if (locale === "es") return es_boost_searchrecipients1(inputs)
	if (locale === "de") return de_boost_searchrecipients1(inputs)
	if (locale === "ar") return ar_boost_searchrecipients1(inputs)
	if (locale === "fr") return fr_boost_searchrecipients1(inputs)
	return ko_boost_searchrecipients1(inputs)
});
export { boost_searchrecipients1 as "boost.searchRecipients" }