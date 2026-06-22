/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Basicinfo_Issuernameplaceholder3Inputs */

const en_boost_cms_basicinfo_issuernameplaceholder3 = /** @type {(inputs: Boost_Cms_Basicinfo_Issuernameplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issuer Name`)
};

const es_boost_cms_basicinfo_issuernameplaceholder3 = /** @type {(inputs: Boost_Cms_Basicinfo_Issuernameplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre del emisor`)
};

const fr_boost_cms_basicinfo_issuernameplaceholder3 = /** @type {(inputs: Boost_Cms_Basicinfo_Issuernameplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom de l'émetteur`)
};

const ar_boost_cms_basicinfo_issuernameplaceholder3 = /** @type {(inputs: Boost_Cms_Basicinfo_Issuernameplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم المُصدر`)
};

/**
* | output |
* | --- |
* | "Issuer Name" |
*
* @param {Boost_Cms_Basicinfo_Issuernameplaceholder3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_basicinfo_issuernameplaceholder3 = /** @type {((inputs?: Boost_Cms_Basicinfo_Issuernameplaceholder3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Basicinfo_Issuernameplaceholder3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_basicinfo_issuernameplaceholder3(inputs)
	if (locale === "es") return es_boost_cms_basicinfo_issuernameplaceholder3(inputs)
	if (locale === "fr") return fr_boost_cms_basicinfo_issuernameplaceholder3(inputs)
	return ar_boost_cms_basicinfo_issuernameplaceholder3(inputs)
});
export { boost_cms_basicinfo_issuernameplaceholder3 as "boost.cms.basicInfo.issuerNamePlaceholder" }