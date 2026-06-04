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

const de_boost_expired = /** @type {(inputs: Boost_ExpiredInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abgelaufen`)
};

const ar_boost_expired = /** @type {(inputs: Boost_ExpiredInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`منتهية الصلاحية`)
};

const fr_boost_expired = /** @type {(inputs: Boost_ExpiredInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expiré`)
};

const ko_boost_expired = /** @type {(inputs: Boost_ExpiredInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`만료됨`)
};

/**
* | output |
* | --- |
* | "Expired" |
*
* @param {Boost_ExpiredInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const boost_expired = /** @type {((inputs?: Boost_ExpiredInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_ExpiredInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_expired(inputs)
	if (locale === "es") return es_boost_expired(inputs)
	if (locale === "de") return de_boost_expired(inputs)
	if (locale === "ar") return ar_boost_expired(inputs)
	if (locale === "fr") return fr_boost_expired(inputs)
	return ko_boost_expired(inputs)
});
export { boost_expired as "boost.expired" }