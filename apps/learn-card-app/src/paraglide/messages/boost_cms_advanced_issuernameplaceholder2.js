/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Advanced_Issuernameplaceholder2Inputs */

const en_boost_cms_advanced_issuernameplaceholder2 = /** @type {(inputs: Boost_Cms_Advanced_Issuernameplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issuer Name`)
};

const es_boost_cms_advanced_issuernameplaceholder2 = /** @type {(inputs: Boost_Cms_Advanced_Issuernameplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre del emisor`)
};

const fr_boost_cms_advanced_issuernameplaceholder2 = /** @type {(inputs: Boost_Cms_Advanced_Issuernameplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom de l'émetteur`)
};

const ar_boost_cms_advanced_issuernameplaceholder2 = /** @type {(inputs: Boost_Cms_Advanced_Issuernameplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم المُصدر`)
};

/**
* | output |
* | --- |
* | "Issuer Name" |
*
* @param {Boost_Cms_Advanced_Issuernameplaceholder2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_advanced_issuernameplaceholder2 = /** @type {((inputs?: Boost_Cms_Advanced_Issuernameplaceholder2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Advanced_Issuernameplaceholder2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_advanced_issuernameplaceholder2(inputs)
	if (locale === "es") return es_boost_cms_advanced_issuernameplaceholder2(inputs)
	if (locale === "fr") return fr_boost_cms_advanced_issuernameplaceholder2(inputs)
	return ar_boost_cms_advanced_issuernameplaceholder2(inputs)
});
export { boost_cms_advanced_issuernameplaceholder2 as "boost.cms.advanced.issuerNamePlaceholder" }