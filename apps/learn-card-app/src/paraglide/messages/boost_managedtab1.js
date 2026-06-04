/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Managedtab1Inputs */

const en_boost_managedtab1 = /** @type {(inputs: Boost_Managedtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Managed`)
};

const es_boost_managedtab1 = /** @type {(inputs: Boost_Managedtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestionados`)
};

const de_boost_managedtab1 = /** @type {(inputs: Boost_Managedtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verwaltet`)
};

const ar_boost_managedtab1 = /** @type {(inputs: Boost_Managedtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المُدارة`)
};

const fr_boost_managedtab1 = /** @type {(inputs: Boost_Managedtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gérés`)
};

const ko_boost_managedtab1 = /** @type {(inputs: Boost_Managedtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`관리`)
};

/**
* | output |
* | --- |
* | "Managed" |
*
* @param {Boost_Managedtab1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const boost_managedtab1 = /** @type {((inputs?: Boost_Managedtab1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Managedtab1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_managedtab1(inputs)
	if (locale === "es") return es_boost_managedtab1(inputs)
	if (locale === "de") return de_boost_managedtab1(inputs)
	if (locale === "ar") return ar_boost_managedtab1(inputs)
	if (locale === "fr") return fr_boost_managedtab1(inputs)
	return ko_boost_managedtab1(inputs)
});
export { boost_managedtab1 as "boost.managedTab" }