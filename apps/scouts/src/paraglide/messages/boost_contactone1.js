/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Contactone1Inputs */

const en_boost_contactone1 = /** @type {(inputs: Boost_Contactone1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contact`)
};

const es_boost_contactone1 = /** @type {(inputs: Boost_Contactone1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contacto`)
};

const fr_boost_contactone1 = /** @type {(inputs: Boost_Contactone1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contact`)
};

const ar_boost_contactone1 = /** @type {(inputs: Boost_Contactone1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contact`)
};

/**
* | output |
* | --- |
* | "Contact" |
*
* @param {Boost_Contactone1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_contactone1 = /** @type {((inputs?: Boost_Contactone1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Contactone1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_contactone1(inputs)
	if (locale === "es") return es_boost_contactone1(inputs)
	if (locale === "fr") return fr_boost_contactone1(inputs)
	return ar_boost_contactone1(inputs)
});
export { boost_contactone1 as "boost.contactOne" }