/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_NetworkInputs */

const en_boost_network = /** @type {(inputs: Boost_NetworkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Network`)
};

const es_boost_network = /** @type {(inputs: Boost_NetworkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Red`)
};

const fr_boost_network = /** @type {(inputs: Boost_NetworkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réseau`)
};

const ar_boost_network = /** @type {(inputs: Boost_NetworkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Network`)
};

/**
* | output |
* | --- |
* | "Network" |
*
* @param {Boost_NetworkInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_network = /** @type {((inputs?: Boost_NetworkInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_NetworkInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_network(inputs)
	if (locale === "es") return es_boost_network(inputs)
	if (locale === "fr") return fr_boost_network(inputs)
	return ar_boost_network(inputs)
});
export { boost_network as "boost.network" }