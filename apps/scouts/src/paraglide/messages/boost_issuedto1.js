/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown>, person: NonNullable<unknown> }} Boost_Issuedto1Inputs */

const en_boost_issuedto1 = /** @type {(inputs: Boost_Issuedto1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Issued to ${i?.count} ${i?.person}`)
};

const es_boost_issuedto1 = /** @type {(inputs: Boost_Issuedto1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Emitido a ${i?.count} ${i?.person}`)
};

const fr_boost_issuedto1 = /** @type {(inputs: Boost_Issuedto1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Délivré à ${i?.count} ${i?.person}`)
};

const ar_boost_issuedto1 = /** @type {(inputs: Boost_Issuedto1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Issued to ${i?.count} ${i?.person}`)
};

/**
* | output |
* | --- |
* | "Issued to {count} {person}" |
*
* @param {Boost_Issuedto1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_issuedto1 = /** @type {((inputs: Boost_Issuedto1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Issuedto1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_issuedto1(inputs)
	if (locale === "es") return es_boost_issuedto1(inputs)
	if (locale === "fr") return fr_boost_issuedto1(inputs)
	return ar_boost_issuedto1(inputs)
});
export { boost_issuedto1 as "boost.issuedTo" }