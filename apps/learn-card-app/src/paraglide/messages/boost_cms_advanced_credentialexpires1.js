/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Advanced_Credentialexpires1Inputs */

const en_boost_cms_advanced_credentialexpires1 = /** @type {(inputs: Boost_Cms_Advanced_Credentialexpires1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential Expires`)
};

const es_boost_cms_advanced_credentialexpires1 = /** @type {(inputs: Boost_Cms_Advanced_Credentialexpires1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La credencial caduca`)
};

const fr_boost_cms_advanced_credentialexpires1 = /** @type {(inputs: Boost_Cms_Advanced_Credentialexpires1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La crédential expire`)
};

const ar_boost_cms_advanced_credentialexpires1 = /** @type {(inputs: Boost_Cms_Advanced_Credentialexpires1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تنتهي صلاحية الاعتماد`)
};

/**
* | output |
* | --- |
* | "Credential Expires" |
*
* @param {Boost_Cms_Advanced_Credentialexpires1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_advanced_credentialexpires1 = /** @type {((inputs?: Boost_Cms_Advanced_Credentialexpires1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Advanced_Credentialexpires1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_advanced_credentialexpires1(inputs)
	if (locale === "es") return es_boost_cms_advanced_credentialexpires1(inputs)
	if (locale === "fr") return fr_boost_cms_advanced_credentialexpires1(inputs)
	return ar_boost_cms_advanced_credentialexpires1(inputs)
});
export { boost_cms_advanced_credentialexpires1 as "boost.cms.advanced.credentialExpires" }