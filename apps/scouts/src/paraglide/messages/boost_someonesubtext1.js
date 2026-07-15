/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Someonesubtext1Inputs */

const en_boost_someonesubtext1 = /** @type {(inputs: Boost_Someonesubtext1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue credentials to people you know, teach and admire. Every boost of encouragement counts.`)
};

const es_boost_someonesubtext1 = /** @type {(inputs: Boost_Someonesubtext1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emite credenciales a personas que conoces, enseñas y admiras. Cada boost de ánimo cuenta.`)
};

const fr_boost_someonesubtext1 = /** @type {(inputs: Boost_Someonesubtext1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Délivrez des justificatifs aux personnes que vous connaissez, enseignez et admirez. Chaque encouragement compte.`)
};

const ar_boost_someonesubtext1 = /** @type {(inputs: Boost_Someonesubtext1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue credentials to people you know, teach and admire. Every boost of encouragement counts.`)
};

/**
* | output |
* | --- |
* | "Issue credentials to people you know, teach and admire. Every boost of encouragement counts." |
*
* @param {Boost_Someonesubtext1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_someonesubtext1 = /** @type {((inputs?: Boost_Someonesubtext1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Someonesubtext1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_someonesubtext1(inputs)
	if (locale === "es") return es_boost_someonesubtext1(inputs)
	if (locale === "fr") return fr_boost_someonesubtext1(inputs)
	return ar_boost_someonesubtext1(inputs)
});
export { boost_someonesubtext1 as "boost.someoneSubtext" }