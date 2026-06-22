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

const fr_boost_unpublish = /** @type {(inputs: Boost_UnpublishInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dépublier`)
};

const ar_boost_unpublish = /** @type {(inputs: Boost_UnpublishInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إلغاء النشر`)
};

/**
* | output |
* | --- |
* | "Unpublish" |
*
* @param {Boost_UnpublishInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_unpublish = /** @type {((inputs?: Boost_UnpublishInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_UnpublishInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_unpublish(inputs)
	if (locale === "es") return es_boost_unpublish(inputs)
	if (locale === "fr") return fr_boost_unpublish(inputs)
	return ar_boost_unpublish(inputs)
});
export { boost_unpublish as "boost.unpublish" }