/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ title: NonNullable<unknown> }} Boost_Titlepack1Inputs */

const en_boost_titlepack1 = /** @type {(inputs: Boost_Titlepack1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.title} Pack`)
};

const es_boost_titlepack1 = /** @type {(inputs: Boost_Titlepack1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Pack de ${i?.title}`)
};

const fr_boost_titlepack1 = /** @type {(inputs: Boost_Titlepack1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Pack ${i?.title}`)
};

const ar_boost_titlepack1 = /** @type {(inputs: Boost_Titlepack1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`حزمة ${i?.title}`)
};

/**
* | output |
* | --- |
* | "{title} Pack" |
*
* @param {Boost_Titlepack1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_titlepack1 = /** @type {((inputs: Boost_Titlepack1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Titlepack1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_titlepack1(inputs)
	if (locale === "es") return es_boost_titlepack1(inputs)
	if (locale === "fr") return fr_boost_titlepack1(inputs)
	return ar_boost_titlepack1(inputs)
});
export { boost_titlepack1 as "boost.titlePack" }