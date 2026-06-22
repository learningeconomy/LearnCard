/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Boost_Recipientcount1Inputs */

const en_boost_recipientcount1 = /** @type {(inputs: Boost_Recipientcount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} recipient(s)`)
};

const es_boost_recipientcount1 = /** @type {(inputs: Boost_Recipientcount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} destinatario(s)`)
};

const fr_boost_recipientcount1 = /** @type {(inputs: Boost_Recipientcount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} destinataire(s)`)
};

const ar_boost_recipientcount1 = /** @type {(inputs: Boost_Recipientcount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} مستلم(ين)`)
};

/**
* | output |
* | --- |
* | "{count} recipient(s)" |
*
* @param {Boost_Recipientcount1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_recipientcount1 = /** @type {((inputs: Boost_Recipientcount1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Recipientcount1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_recipientcount1(inputs)
	if (locale === "es") return es_boost_recipientcount1(inputs)
	if (locale === "fr") return fr_boost_recipientcount1(inputs)
	return ar_boost_recipientcount1(inputs)
});
export { boost_recipientcount1 as "boost.recipientCount" }