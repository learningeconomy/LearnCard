/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_ExpiredInputs */

const en_boost_expired = /** @type {(inputs: Boost_ExpiredInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expired`)
};

const es_boost_expired = /** @type {(inputs: Boost_ExpiredInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expirado`)
};

const fr_boost_expired = /** @type {(inputs: Boost_ExpiredInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expiré`)
};

const ar_boost_expired = /** @type {(inputs: Boost_ExpiredInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`منتهية الصلاحية`)
};

/**
* | output |
* | --- |
* | "Expired" |
*
* @param {Boost_ExpiredInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_expired = /** @type {((inputs?: Boost_ExpiredInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_ExpiredInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_expired(inputs)
	if (locale === "es") return es_boost_expired(inputs)
	if (locale === "fr") return fr_boost_expired(inputs)
	return ar_boost_expired(inputs)
});
export { boost_expired as "boost.expired" }