/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Contactother1Inputs */

const en_boost_contactother1 = /** @type {(inputs: Boost_Contactother1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contacts`)
};

const es_boost_contactother1 = /** @type {(inputs: Boost_Contactother1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contactos`)
};

const fr_boost_contactother1 = /** @type {(inputs: Boost_Contactother1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contacts`)
};

const ar_boost_contactother1 = /** @type {(inputs: Boost_Contactother1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جهات اتصال`)
};

/**
* | output |
* | --- |
* | "Contacts" |
*
* @param {Boost_Contactother1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_contactother1 = /** @type {((inputs?: Boost_Contactother1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Contactother1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_contactother1(inputs)
	if (locale === "es") return es_boost_contactother1(inputs)
	if (locale === "fr") return fr_boost_contactother1(inputs)
	return ar_boost_contactother1(inputs)
});
export { boost_contactother1 as "boost.contactOther" }