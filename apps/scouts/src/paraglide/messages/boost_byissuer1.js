/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown>, date: NonNullable<unknown> }} Boost_Byissuer1Inputs */

const en_boost_byissuer1 = /** @type {(inputs: Boost_Byissuer1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`by ${i?.name} ${i?.date}`)
};

const es_boost_byissuer1 = /** @type {(inputs: Boost_Byissuer1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`por ${i?.name} ${i?.date}`)
};

const fr_boost_byissuer1 = /** @type {(inputs: Boost_Byissuer1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`par ${i?.name} ${i?.date}`)
};

const ar_boost_byissuer1 = /** @type {(inputs: Boost_Byissuer1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`بواسطة ${i?.name} ${i?.date}`)
};

/**
* | output |
* | --- |
* | "by {name} {date}" |
*
* @param {Boost_Byissuer1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_byissuer1 = /** @type {((inputs: Boost_Byissuer1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Byissuer1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_byissuer1(inputs)
	if (locale === "es") return es_boost_byissuer1(inputs)
	if (locale === "fr") return fr_boost_byissuer1(inputs)
	return ar_boost_byissuer1(inputs)
});
export { boost_byissuer1 as "boost.byIssuer" }