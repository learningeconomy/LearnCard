/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Networkmemberlabelone3Inputs */

const en_boost_networkmemberlabelone3 = /** @type {(inputs: Boost_Networkmemberlabelone3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Network Member`)
};

const es_boost_networkmemberlabelone3 = /** @type {(inputs: Boost_Networkmemberlabelone3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Miembro de la Red`)
};

const fr_boost_networkmemberlabelone3 = /** @type {(inputs: Boost_Networkmemberlabelone3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Membre du réseau`)
};

const ar_boost_networkmemberlabelone3 = /** @type {(inputs: Boost_Networkmemberlabelone3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Network Member`)
};

/**
* | output |
* | --- |
* | "Network Member" |
*
* @param {Boost_Networkmemberlabelone3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_networkmemberlabelone3 = /** @type {((inputs?: Boost_Networkmemberlabelone3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Networkmemberlabelone3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_networkmemberlabelone3(inputs)
	if (locale === "es") return es_boost_networkmemberlabelone3(inputs)
	if (locale === "fr") return fr_boost_networkmemberlabelone3(inputs)
	return ar_boost_networkmemberlabelone3(inputs)
});
export { boost_networkmemberlabelone3 as "boost.networkMemberLabelOne" }