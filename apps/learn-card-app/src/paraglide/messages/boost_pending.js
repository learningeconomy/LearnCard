/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_PendingInputs */

const en_boost_pending = /** @type {(inputs: Boost_PendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pending`)
};

const es_boost_pending = /** @type {(inputs: Boost_PendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pendiente`)
};

const de_boost_pending = /** @type {(inputs: Boost_PendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ausstehend`)
};

const ar_boost_pending = /** @type {(inputs: Boost_PendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قيد الانتظار`)
};

const fr_boost_pending = /** @type {(inputs: Boost_PendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`En attente`)
};

const ko_boost_pending = /** @type {(inputs: Boost_PendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`대기 중`)
};

/**
* | output |
* | --- |
* | "Pending" |
*
* @param {Boost_PendingInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const boost_pending = /** @type {((inputs?: Boost_PendingInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_PendingInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_pending(inputs)
	if (locale === "es") return es_boost_pending(inputs)
	if (locale === "de") return de_boost_pending(inputs)
	if (locale === "ar") return ar_boost_pending(inputs)
	if (locale === "fr") return fr_boost_pending(inputs)
	return ko_boost_pending(inputs)
});
export { boost_pending as "boost.pending" }