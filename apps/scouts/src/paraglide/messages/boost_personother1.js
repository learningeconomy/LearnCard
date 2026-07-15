/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Personother1Inputs */

const en_boost_personother1 = /** @type {(inputs: Boost_Personother1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`people`)
};

const es_boost_personother1 = /** @type {(inputs: Boost_Personother1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`personas`)
};

const fr_boost_personother1 = /** @type {(inputs: Boost_Personother1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`personnes`)
};

const ar_boost_personother1 = /** @type {(inputs: Boost_Personother1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`people`)
};

/**
* | output |
* | --- |
* | "people" |
*
* @param {Boost_Personother1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_personother1 = /** @type {((inputs?: Boost_Personother1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Personother1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_personother1(inputs)
	if (locale === "es") return es_boost_personother1(inputs)
	if (locale === "fr") return fr_boost_personother1(inputs)
	return ar_boost_personother1(inputs)
});
export { boost_personother1 as "boost.personOther" }