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

const fr_boost_searchrecipients1 = /** @type {(inputs: Boost_Searchrecipients1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechercher des destinataires...`)
};

const ar_boost_searchrecipients1 = /** @type {(inputs: Boost_Searchrecipients1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`البحث عن مستلمين...`)
};

/**
* | output |
* | --- |
* | "Search recipients..." |
*
* @param {Boost_Searchrecipients1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_searchrecipients1 = /** @type {((inputs?: Boost_Searchrecipients1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Searchrecipients1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_searchrecipients1(inputs)
	if (locale === "es") return es_boost_searchrecipients1(inputs)
	if (locale === "fr") return fr_boost_searchrecipients1(inputs)
	return ar_boost_searchrecipients1(inputs)
});
export { boost_searchrecipients1 as "boost.searchRecipients" }