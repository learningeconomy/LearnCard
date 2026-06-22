/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_PublishedInputs */

const en_boost_published = /** @type {(inputs: Boost_PublishedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Published`)
};

const es_boost_published = /** @type {(inputs: Boost_PublishedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publicado`)
};

const fr_boost_published = /** @type {(inputs: Boost_PublishedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publié`)
};

const ar_boost_published = /** @type {(inputs: Boost_PublishedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`منشور`)
};

/**
* | output |
* | --- |
* | "Published" |
*
* @param {Boost_PublishedInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_published = /** @type {((inputs?: Boost_PublishedInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_PublishedInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_published(inputs)
	if (locale === "es") return es_boost_published(inputs)
	if (locale === "fr") return fr_boost_published(inputs)
	return ar_boost_published(inputs)
});
export { boost_published as "boost.published" }