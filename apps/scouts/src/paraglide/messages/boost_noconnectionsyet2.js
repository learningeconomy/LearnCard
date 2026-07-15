/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Noconnectionsyet2Inputs */

const en_boost_noconnectionsyet2 = /** @type {(inputs: Boost_Noconnectionsyet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No connections yet`)
};

const es_boost_noconnectionsyet2 = /** @type {(inputs: Boost_Noconnectionsyet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún sin conexiones`)
};

const fr_boost_noconnectionsyet2 = /** @type {(inputs: Boost_Noconnectionsyet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune connexion pour l'instant`)
};

const ar_boost_noconnectionsyet2 = /** @type {(inputs: Boost_Noconnectionsyet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد اتصالات بعد`)
};

/**
* | output |
* | --- |
* | "No connections yet" |
*
* @param {Boost_Noconnectionsyet2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_noconnectionsyet2 = /** @type {((inputs?: Boost_Noconnectionsyet2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Noconnectionsyet2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_noconnectionsyet2(inputs)
	if (locale === "es") return es_boost_noconnectionsyet2(inputs)
	if (locale === "fr") return fr_boost_noconnectionsyet2(inputs)
	return ar_boost_noconnectionsyet2(inputs)
});
export { boost_noconnectionsyet2 as "boost.noConnectionsYet" }