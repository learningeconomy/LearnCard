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

const de_boost_publishing = /** @type {(inputs: Boost_PublishingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wird veröffentlicht...`)
};

const ar_boost_publishing = /** @type {(inputs: Boost_PublishingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري النشر...`)
};

const fr_boost_publishing = /** @type {(inputs: Boost_PublishingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publication...`)
};

const ko_boost_publishing = /** @type {(inputs: Boost_PublishingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`게시 중...`)
};

/**
* | output |
* | --- |
* | "Publishing..." |
*
* @param {Boost_PublishingInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const boost_publishing = /** @type {((inputs?: Boost_PublishingInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_PublishingInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_publishing(inputs)
	if (locale === "es") return es_boost_publishing(inputs)
	if (locale === "de") return de_boost_publishing(inputs)
	if (locale === "ar") return ar_boost_publishing(inputs)
	if (locale === "fr") return fr_boost_publishing(inputs)
	return ko_boost_publishing(inputs)
});
export { boost_publishing as "boost.publishing" }