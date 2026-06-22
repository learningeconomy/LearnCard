/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Browsemanagedplaceholder2Inputs */

const en_boost_browsemanagedplaceholder2 = /** @type {(inputs: Boost_Browsemanagedplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Browse managed...`)
};

const es_boost_browsemanagedplaceholder2 = /** @type {(inputs: Boost_Browsemanagedplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explorar gestionados...`)
};

const fr_boost_browsemanagedplaceholder2 = /** @type {(inputs: Boost_Browsemanagedplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Parcourir les gérés...`)
};

const ar_boost_browsemanagedplaceholder2 = /** @type {(inputs: Boost_Browsemanagedplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تصفّح المُدارة...`)
};

/**
* | output |
* | --- |
* | "Browse managed..." |
*
* @param {Boost_Browsemanagedplaceholder2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_browsemanagedplaceholder2 = /** @type {((inputs?: Boost_Browsemanagedplaceholder2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Browsemanagedplaceholder2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_browsemanagedplaceholder2(inputs)
	if (locale === "es") return es_boost_browsemanagedplaceholder2(inputs)
	if (locale === "fr") return fr_boost_browsemanagedplaceholder2(inputs)
	return ar_boost_browsemanagedplaceholder2(inputs)
});
export { boost_browsemanagedplaceholder2 as "boost.browseManagedPlaceholder" }