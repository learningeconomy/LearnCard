/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Boost_Issuedtoname2Inputs */

const en_boost_issuedtoname2 = /** @type {(inputs: Boost_Issuedtoname2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Issued to ${i?.name}`)
};

const es_boost_issuedtoname2 = /** @type {(inputs: Boost_Issuedtoname2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Emitido a ${i?.name}`)
};

const fr_boost_issuedtoname2 = /** @type {(inputs: Boost_Issuedtoname2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Délivré à ${i?.name}`)
};

const ar_boost_issuedtoname2 = /** @type {(inputs: Boost_Issuedtoname2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Issued to ${i?.name}`)
};

/**
* | output |
* | --- |
* | "Issued to {name}" |
*
* @param {Boost_Issuedtoname2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_issuedtoname2 = /** @type {((inputs: Boost_Issuedtoname2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Issuedtoname2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_issuedtoname2(inputs)
	if (locale === "es") return es_boost_issuedtoname2(inputs)
	if (locale === "fr") return fr_boost_issuedtoname2(inputs)
	return ar_boost_issuedtoname2(inputs)
});
export { boost_issuedtoname2 as "boost.issuedToName" }