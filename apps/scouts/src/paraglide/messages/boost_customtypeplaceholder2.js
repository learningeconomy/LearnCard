/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Customtypeplaceholder2Inputs */

const en_boost_customtypeplaceholder2 = /** @type {(inputs: Boost_Customtypeplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Custom Type...`)
};

const es_boost_customtypeplaceholder2 = /** @type {(inputs: Boost_Customtypeplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tipo Personalizado...`)
};

const fr_boost_customtypeplaceholder2 = /** @type {(inputs: Boost_Customtypeplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Type personnalisé...`)
};

const ar_boost_customtypeplaceholder2 = /** @type {(inputs: Boost_Customtypeplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نوع مخصص...`)
};

/**
* | output |
* | --- |
* | "Custom Type..." |
*
* @param {Boost_Customtypeplaceholder2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_customtypeplaceholder2 = /** @type {((inputs?: Boost_Customtypeplaceholder2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Customtypeplaceholder2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_customtypeplaceholder2(inputs)
	if (locale === "es") return es_boost_customtypeplaceholder2(inputs)
	if (locale === "fr") return fr_boost_customtypeplaceholder2(inputs)
	return ar_boost_customtypeplaceholder2(inputs)
});
export { boost_customtypeplaceholder2 as "boost.customTypePlaceholder" }