/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Socialbadge1Inputs */

const en_boost_socialbadge1 = /** @type {(inputs: Boost_Socialbadge1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Social Badge`)
};

const es_boost_socialbadge1 = /** @type {(inputs: Boost_Socialbadge1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Insignia social`)
};

const fr_boost_socialbadge1 = /** @type {(inputs: Boost_Socialbadge1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Badge social`)
};

const ar_boost_socialbadge1 = /** @type {(inputs: Boost_Socialbadge1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شارة اجتماعية`)
};

/**
* | output |
* | --- |
* | "Social Badge" |
*
* @param {Boost_Socialbadge1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_socialbadge1 = /** @type {((inputs?: Boost_Socialbadge1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Socialbadge1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_socialbadge1(inputs)
	if (locale === "es") return es_boost_socialbadge1(inputs)
	if (locale === "fr") return fr_boost_socialbadge1(inputs)
	return ar_boost_socialbadge1(inputs)
});
export { boost_socialbadge1 as "boost.socialBadge" }