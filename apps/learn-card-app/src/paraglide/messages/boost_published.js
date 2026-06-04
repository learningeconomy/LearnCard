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

const de_boost_published = /** @type {(inputs: Boost_PublishedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veröffentlicht`)
};

const ar_boost_published = /** @type {(inputs: Boost_PublishedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`منشور`)
};

const fr_boost_published = /** @type {(inputs: Boost_PublishedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publié`)
};

const ko_boost_published = /** @type {(inputs: Boost_PublishedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`게시됨`)
};

/**
* | output |
* | --- |
* | "Published" |
*
* @param {Boost_PublishedInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const boost_published = /** @type {((inputs?: Boost_PublishedInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_PublishedInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_published(inputs)
	if (locale === "es") return es_boost_published(inputs)
	if (locale === "de") return de_boost_published(inputs)
	if (locale === "ar") return ar_boost_published(inputs)
	if (locale === "fr") return fr_boost_published(inputs)
	return ko_boost_published(inputs)
});
export { boost_published as "boost.published" }