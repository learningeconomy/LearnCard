/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Networkmemberlabelother3Inputs */

const en_boost_networkmemberlabelother3 = /** @type {(inputs: Boost_Networkmemberlabelother3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Network Members`)
};

const es_boost_networkmemberlabelother3 = /** @type {(inputs: Boost_Networkmemberlabelother3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Miembros de la Red`)
};

const fr_boost_networkmemberlabelother3 = /** @type {(inputs: Boost_Networkmemberlabelother3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Membres du réseau`)
};

const ar_boost_networkmemberlabelother3 = /** @type {(inputs: Boost_Networkmemberlabelother3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أعضاء الشبكة`)
};

/**
* | output |
* | --- |
* | "Network Members" |
*
* @param {Boost_Networkmemberlabelother3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_networkmemberlabelother3 = /** @type {((inputs?: Boost_Networkmemberlabelother3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Networkmemberlabelother3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_networkmemberlabelother3(inputs)
	if (locale === "es") return es_boost_networkmemberlabelother3(inputs)
	if (locale === "fr") return fr_boost_networkmemberlabelother3(inputs)
	return ar_boost_networkmemberlabelother3(inputs)
});
export { boost_networkmemberlabelother3 as "boost.networkMemberLabelOther" }