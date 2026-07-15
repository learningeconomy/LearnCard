/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ title: NonNullable<unknown> }} Boost_Newtitle1Inputs */

const en_boost_newtitle1 = /** @type {(inputs: Boost_Newtitle1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`New ${i?.title}`)
};

const es_boost_newtitle1 = /** @type {(inputs: Boost_Newtitle1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Nuevo ${i?.title}`)
};

const fr_boost_newtitle1 = /** @type {(inputs: Boost_Newtitle1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Nouveau ${i?.title}`)
};

const ar_boost_newtitle1 = /** @type {(inputs: Boost_Newtitle1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`New ${i?.title}`)
};

/**
* | output |
* | --- |
* | "New {title}" |
*
* @param {Boost_Newtitle1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_newtitle1 = /** @type {((inputs: Boost_Newtitle1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Newtitle1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_newtitle1(inputs)
	if (locale === "es") return es_boost_newtitle1(inputs)
	if (locale === "fr") return fr_boost_newtitle1(inputs)
	return ar_boost_newtitle1(inputs)
});
export { boost_newtitle1 as "boost.newTitle" }