/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Copylink1Inputs */

const en_boost_copylink1 = /** @type {(inputs: Boost_Copylink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy Link`)
};

const es_boost_copylink1 = /** @type {(inputs: Boost_Copylink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copiar Enlace`)
};

const fr_boost_copylink1 = /** @type {(inputs: Boost_Copylink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copier le lien`)
};

const ar_boost_copylink1 = /** @type {(inputs: Boost_Copylink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy Link`)
};

/**
* | output |
* | --- |
* | "Copy Link" |
*
* @param {Boost_Copylink1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_copylink1 = /** @type {((inputs?: Boost_Copylink1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Copylink1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_copylink1(inputs)
	if (locale === "es") return es_boost_copylink1(inputs)
	if (locale === "fr") return fr_boost_copylink1(inputs)
	return ar_boost_copylink1(inputs)
});
export { boost_copylink1 as "boost.copyLink" }