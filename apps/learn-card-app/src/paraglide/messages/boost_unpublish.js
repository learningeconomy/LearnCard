/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_UnpublishInputs */

const en_boost_unpublish = /** @type {(inputs: Boost_UnpublishInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unpublish`)
};

const es_boost_unpublish = /** @type {(inputs: Boost_UnpublishInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Despublicar`)
};

const de_boost_unpublish = /** @type {(inputs: Boost_UnpublishInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veröffentlichung aufheben`)
};

const ar_boost_unpublish = /** @type {(inputs: Boost_UnpublishInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إلغاء النشر`)
};

const fr_boost_unpublish = /** @type {(inputs: Boost_UnpublishInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dépublier`)
};

const ko_boost_unpublish = /** @type {(inputs: Boost_UnpublishInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`게시 취소`)
};

/**
* | output |
* | --- |
* | "Unpublish" |
*
* @param {Boost_UnpublishInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const boost_unpublish = /** @type {((inputs?: Boost_UnpublishInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_UnpublishInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_unpublish(inputs)
	if (locale === "es") return es_boost_unpublish(inputs)
	if (locale === "de") return de_boost_unpublish(inputs)
	if (locale === "ar") return ar_boost_unpublish(inputs)
	if (locale === "fr") return fr_boost_unpublish(inputs)
	return ko_boost_unpublish(inputs)
});
export { boost_unpublish as "boost.unpublish" }