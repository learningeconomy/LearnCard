/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ title: NonNullable<unknown> }} Boost_Mytitles1Inputs */

const en_boost_mytitles1 = /** @type {(inputs: Boost_Mytitles1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`My ${i?.title}s`)
};

const es_boost_mytitles1 = /** @type {(inputs: Boost_Mytitles1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Mis ${i?.title}s`)
};

const fr_boost_mytitles1 = /** @type {(inputs: Boost_Mytitles1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Mes ${i?.title}s`)
};

const ar_boost_mytitles1 = /** @type {(inputs: Boost_Mytitles1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.title} الخاصة بي`)
};

/**
* | output |
* | --- |
* | "My {title}s" |
*
* @param {Boost_Mytitles1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_mytitles1 = /** @type {((inputs: Boost_Mytitles1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Mytitles1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_mytitles1(inputs)
	if (locale === "es") return es_boost_mytitles1(inputs)
	if (locale === "fr") return fr_boost_mytitles1(inputs)
	return ar_boost_mytitles1(inputs)
});
export { boost_mytitles1 as "boost.myTitles" }