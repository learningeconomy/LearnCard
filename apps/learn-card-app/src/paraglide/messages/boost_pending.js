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

const fr_boost_pending = /** @type {(inputs: Boost_PendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`En attente`)
};

const ar_boost_pending = /** @type {(inputs: Boost_PendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قيد الانتظار`)
};

/**
* | output |
* | --- |
* | "Pending" |
*
* @param {Boost_PendingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_pending = /** @type {((inputs?: Boost_PendingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_PendingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_pending(inputs)
	if (locale === "es") return es_boost_pending(inputs)
	if (locale === "fr") return fr_boost_pending(inputs)
	return ar_boost_pending(inputs)
});
export { boost_pending as "boost.pending" }