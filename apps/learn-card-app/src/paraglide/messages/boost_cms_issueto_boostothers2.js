/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Issueto_Boostothers2Inputs */

const en_boost_cms_issueto_boostothers2 = /** @type {(inputs: Boost_Cms_Issueto_Boostothers2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost Others`)
};

const es_boost_cms_issueto_boostothers2 = /** @type {(inputs: Boost_Cms_Issueto_Boostothers2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emitir a otros`)
};

const fr_boost_cms_issueto_boostothers2 = /** @type {(inputs: Boost_Cms_Issueto_Boostothers2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Délivrer à d'autres`)
};

const ar_boost_cms_issueto_boostothers2 = /** @type {(inputs: Boost_Cms_Issueto_Boostothers2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إصدار Boost لآخرين`)
};

/**
* | output |
* | --- |
* | "Boost Others" |
*
* @param {Boost_Cms_Issueto_Boostothers2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_issueto_boostothers2 = /** @type {((inputs?: Boost_Cms_Issueto_Boostothers2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Issueto_Boostothers2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_issueto_boostothers2(inputs)
	if (locale === "es") return es_boost_cms_issueto_boostothers2(inputs)
	if (locale === "fr") return fr_boost_cms_issueto_boostothers2(inputs)
	return ar_boost_cms_issueto_boostothers2(inputs)
});
export { boost_cms_issueto_boostothers2 as "boost.cms.issueTo.boostOthers" }