/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_PublishInputs */

const en_boost_publish = /** @type {(inputs: Boost_PublishInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publish`)
};

const es_boost_publish = /** @type {(inputs: Boost_PublishInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publicar`)
};

const de_boost_publish = /** @type {(inputs: Boost_PublishInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veröffentlichen`)
};

const ar_boost_publish = /** @type {(inputs: Boost_PublishInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نشر`)
};

const fr_boost_publish = /** @type {(inputs: Boost_PublishInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publier`)
};

const ko_boost_publish = /** @type {(inputs: Boost_PublishInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`게시`)
};

/**
* | output |
* | --- |
* | "Publish" |
*
* @param {Boost_PublishInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const boost_publish = /** @type {((inputs?: Boost_PublishInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_PublishInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_publish(inputs)
	if (locale === "es") return es_boost_publish(inputs)
	if (locale === "de") return de_boost_publish(inputs)
	if (locale === "ar") return ar_boost_publish(inputs)
	if (locale === "fr") return fr_boost_publish(inputs)
	return ko_boost_publish(inputs)
});
export { boost_publish as "boost.publish" }