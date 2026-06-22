/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_PublishingInputs */

const en_boost_publishing = /** @type {(inputs: Boost_PublishingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publishing...`)
};

const es_boost_publishing = /** @type {(inputs: Boost_PublishingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publicando...`)
};

const fr_boost_publishing = /** @type {(inputs: Boost_PublishingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publication...`)
};

const ar_boost_publishing = /** @type {(inputs: Boost_PublishingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري النشر...`)
};

/**
* | output |
* | --- |
* | "Publishing..." |
*
* @param {Boost_PublishingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_publishing = /** @type {((inputs?: Boost_PublishingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_PublishingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_publishing(inputs)
	if (locale === "es") return es_boost_publishing(inputs)
	if (locale === "fr") return fr_boost_publishing(inputs)
	return ar_boost_publishing(inputs)
});
export { boost_publishing as "boost.publishing" }