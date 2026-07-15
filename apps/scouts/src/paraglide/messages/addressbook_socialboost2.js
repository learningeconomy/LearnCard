/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Socialboost2Inputs */

const en_addressbook_socialboost2 = /** @type {(inputs: Addressbook_Socialboost2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Social Boost`)
};

const es_addressbook_socialboost2 = /** @type {(inputs: Addressbook_Socialboost2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost Social`)
};

const fr_addressbook_socialboost2 = /** @type {(inputs: Addressbook_Socialboost2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost social`)
};

const ar_addressbook_socialboost2 = /** @type {(inputs: Addressbook_Socialboost2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Social Boost`)
};

/**
* | output |
* | --- |
* | "Social Boost" |
*
* @param {Addressbook_Socialboost2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_socialboost2 = /** @type {((inputs?: Addressbook_Socialboost2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Socialboost2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_socialboost2(inputs)
	if (locale === "es") return es_addressbook_socialboost2(inputs)
	if (locale === "fr") return fr_addressbook_socialboost2(inputs)
	return ar_addressbook_socialboost2(inputs)
});
export { addressbook_socialboost2 as "addressBook.socialBoost" }