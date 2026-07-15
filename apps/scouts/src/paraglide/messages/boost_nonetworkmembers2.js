/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Nonetworkmembers2Inputs */

const en_boost_nonetworkmembers2 = /** @type {(inputs: Boost_Nonetworkmembers2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No network members`)
};

const es_boost_nonetworkmembers2 = /** @type {(inputs: Boost_Nonetworkmembers2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin miembros de la red`)
};

const fr_boost_nonetworkmembers2 = /** @type {(inputs: Boost_Nonetworkmembers2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun membre du réseau`)
};

const ar_boost_nonetworkmembers2 = /** @type {(inputs: Boost_Nonetworkmembers2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No network members`)
};

/**
* | output |
* | --- |
* | "No network members" |
*
* @param {Boost_Nonetworkmembers2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_nonetworkmembers2 = /** @type {((inputs?: Boost_Nonetworkmembers2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Nonetworkmembers2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_nonetworkmembers2(inputs)
	if (locale === "es") return es_boost_nonetworkmembers2(inputs)
	if (locale === "fr") return fr_boost_nonetworkmembers2(inputs)
	return ar_boost_nonetworkmembers2(inputs)
});
export { boost_nonetworkmembers2 as "boost.noNetworkMembers" }