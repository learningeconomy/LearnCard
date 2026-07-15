/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Addsomeone1Inputs */

const en_boost_addsomeone1 = /** @type {(inputs: Boost_Addsomeone1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add Someone`)
};

const es_boost_addsomeone1 = /** @type {(inputs: Boost_Addsomeone1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir Alguien`)
};

const fr_boost_addsomeone1 = /** @type {(inputs: Boost_Addsomeone1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter quelqu'un`)
};

const ar_boost_addsomeone1 = /** @type {(inputs: Boost_Addsomeone1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add Someone`)
};

/**
* | output |
* | --- |
* | "Add Someone" |
*
* @param {Boost_Addsomeone1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_addsomeone1 = /** @type {((inputs?: Boost_Addsomeone1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Addsomeone1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_addsomeone1(inputs)
	if (locale === "es") return es_boost_addsomeone1(inputs)
	if (locale === "fr") return fr_boost_addsomeone1(inputs)
	return ar_boost_addsomeone1(inputs)
});
export { boost_addsomeone1 as "boost.addSomeone" }