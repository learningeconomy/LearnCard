/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Issueto_Claimlinksunavailabledescription4Inputs */

const en_boost_cms_issueto_claimlinksunavailabledescription4 = /** @type {(inputs: Boost_Cms_Issueto_Claimlinksunavailabledescription4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`permission are disabled.`)
};

const es_boost_cms_issueto_claimlinksunavailabledescription4 = /** @type {(inputs: Boost_Cms_Issueto_Claimlinksunavailabledescription4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`los permisos están deshabilitados.`)
};

const fr_boost_cms_issueto_claimlinksunavailabledescription4 = /** @type {(inputs: Boost_Cms_Issueto_Claimlinksunavailabledescription4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`les permissions sont désactivées.`)
};

const ar_boost_cms_issueto_claimlinksunavailabledescription4 = /** @type {(inputs: Boost_Cms_Issueto_Claimlinksunavailabledescription4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الأذونات معطلة.`)
};

/**
* | output |
* | --- |
* | "permission are disabled." |
*
* @param {Boost_Cms_Issueto_Claimlinksunavailabledescription4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_issueto_claimlinksunavailabledescription4 = /** @type {((inputs?: Boost_Cms_Issueto_Claimlinksunavailabledescription4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Issueto_Claimlinksunavailabledescription4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_issueto_claimlinksunavailabledescription4(inputs)
	if (locale === "es") return es_boost_cms_issueto_claimlinksunavailabledescription4(inputs)
	if (locale === "fr") return fr_boost_cms_issueto_claimlinksunavailabledescription4(inputs)
	return ar_boost_cms_issueto_claimlinksunavailabledescription4(inputs)
});
export { boost_cms_issueto_claimlinksunavailabledescription4 as "boost.cms.issueTo.claimLinksUnavailableDescription" }