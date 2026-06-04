/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_RevokedInputs */

const en_boost_revoked = /** @type {(inputs: Boost_RevokedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revoked`)
};

const es_boost_revoked = /** @type {(inputs: Boost_RevokedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revocado`)
};

const de_boost_revoked = /** @type {(inputs: Boost_RevokedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Widerrufen`)
};

const ar_boost_revoked = /** @type {(inputs: Boost_RevokedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ملغاة`)
};

const fr_boost_revoked = /** @type {(inputs: Boost_RevokedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Révoqué`)
};

const ko_boost_revoked = /** @type {(inputs: Boost_RevokedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`취소됨`)
};

/**
* | output |
* | --- |
* | "Revoked" |
*
* @param {Boost_RevokedInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const boost_revoked = /** @type {((inputs?: Boost_RevokedInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_RevokedInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_revoked(inputs)
	if (locale === "es") return es_boost_revoked(inputs)
	if (locale === "de") return de_boost_revoked(inputs)
	if (locale === "ar") return ar_boost_revoked(inputs)
	if (locale === "fr") return fr_boost_revoked(inputs)
	return ko_boost_revoked(inputs)
});
export { boost_revoked as "boost.revoked" }