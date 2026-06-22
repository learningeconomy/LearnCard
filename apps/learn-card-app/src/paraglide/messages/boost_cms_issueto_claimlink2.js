/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Issueto_Claimlink2Inputs */

const en_boost_cms_issueto_claimlink2 = /** @type {(inputs: Boost_Cms_Issueto_Claimlink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Claim Link`)
};

const es_boost_cms_issueto_claimlink2 = /** @type {(inputs: Boost_Cms_Issueto_Claimlink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enlace de reclamación`)
};

const fr_boost_cms_issueto_claimlink2 = /** @type {(inputs: Boost_Cms_Issueto_Claimlink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lien de réclamation`)
};

const ar_boost_cms_issueto_claimlink2 = /** @type {(inputs: Boost_Cms_Issueto_Claimlink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رابط المطالبة`)
};

/**
* | output |
* | --- |
* | "Claim Link" |
*
* @param {Boost_Cms_Issueto_Claimlink2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_issueto_claimlink2 = /** @type {((inputs?: Boost_Cms_Issueto_Claimlink2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Issueto_Claimlink2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_issueto_claimlink2(inputs)
	if (locale === "es") return es_boost_cms_issueto_claimlink2(inputs)
	if (locale === "fr") return fr_boost_cms_issueto_claimlink2(inputs)
	return ar_boost_cms_issueto_claimlink2(inputs)
});
export { boost_cms_issueto_claimlink2 as "boost.cms.issueTo.claimLink" }