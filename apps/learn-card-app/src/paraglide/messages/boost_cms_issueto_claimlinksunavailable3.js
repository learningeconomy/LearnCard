/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Issueto_Claimlinksunavailable3Inputs */

const en_boost_cms_issueto_claimlinksunavailable3 = /** @type {(inputs: Boost_Cms_Issueto_Claimlinksunavailable3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Claim links are unavailable`)
};

const es_boost_cms_issueto_claimlinksunavailable3 = /** @type {(inputs: Boost_Cms_Issueto_Claimlinksunavailable3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Los enlaces de reclamación no están disponibles`)
};

const fr_boost_cms_issueto_claimlinksunavailable3 = /** @type {(inputs: Boost_Cms_Issueto_Claimlinksunavailable3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les liens de réclamation ne sont pas disponibles`)
};

const ar_boost_cms_issueto_claimlinksunavailable3 = /** @type {(inputs: Boost_Cms_Issueto_Claimlinksunavailable3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`روابط المطالبة غير متاحة`)
};

/**
* | output |
* | --- |
* | "Claim links are unavailable" |
*
* @param {Boost_Cms_Issueto_Claimlinksunavailable3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_issueto_claimlinksunavailable3 = /** @type {((inputs?: Boost_Cms_Issueto_Claimlinksunavailable3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Issueto_Claimlinksunavailable3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_issueto_claimlinksunavailable3(inputs)
	if (locale === "es") return es_boost_cms_issueto_claimlinksunavailable3(inputs)
	if (locale === "fr") return fr_boost_cms_issueto_claimlinksunavailable3(inputs)
	return ar_boost_cms_issueto_claimlinksunavailable3(inputs)
});
export { boost_cms_issueto_claimlinksunavailable3 as "boost.cms.issueTo.claimLinksUnavailable" }