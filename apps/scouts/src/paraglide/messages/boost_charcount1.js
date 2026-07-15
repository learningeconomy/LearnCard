/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown>, max: NonNullable<unknown> }} Boost_Charcount1Inputs */

const en_boost_charcount1 = /** @type {(inputs: Boost_Charcount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count}/${i?.max}`)
};

const es_boost_charcount1 = /** @type {(inputs: Boost_Charcount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count}/${i?.max}`)
};

const fr_boost_charcount1 = /** @type {(inputs: Boost_Charcount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count}/${i?.max}`)
};

const ar_boost_charcount1 = /** @type {(inputs: Boost_Charcount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count}/${i?.max}`)
};

/**
* | output |
* | --- |
* | "{count}/{max}" |
*
* @param {Boost_Charcount1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_charcount1 = /** @type {((inputs: Boost_Charcount1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Charcount1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_charcount1(inputs)
	if (locale === "es") return es_boost_charcount1(inputs)
	if (locale === "fr") return fr_boost_charcount1(inputs)
	return ar_boost_charcount1(inputs)
});
export { boost_charcount1 as "boost.charCount" }