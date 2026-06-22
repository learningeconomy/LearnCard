/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Issueto_Boostmyself2Inputs */

const en_boost_cms_issueto_boostmyself2 = /** @type {(inputs: Boost_Cms_Issueto_Boostmyself2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost Myself`)
};

const es_boost_cms_issueto_boostmyself2 = /** @type {(inputs: Boost_Cms_Issueto_Boostmyself2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emitirme un Boost`)
};

const fr_boost_cms_issueto_boostmyself2 = /** @type {(inputs: Boost_Cms_Issueto_Boostmyself2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Me délivrer un Boost`)
};

const ar_boost_cms_issueto_boostmyself2 = /** @type {(inputs: Boost_Cms_Issueto_Boostmyself2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إصدار Boost لي`)
};

/**
* | output |
* | --- |
* | "Boost Myself" |
*
* @param {Boost_Cms_Issueto_Boostmyself2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_issueto_boostmyself2 = /** @type {((inputs?: Boost_Cms_Issueto_Boostmyself2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Issueto_Boostmyself2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_issueto_boostmyself2(inputs)
	if (locale === "es") return es_boost_cms_issueto_boostmyself2(inputs)
	if (locale === "fr") return fr_boost_cms_issueto_boostmyself2(inputs)
	return ar_boost_cms_issueto_boostmyself2(inputs)
});
export { boost_cms_issueto_boostmyself2 as "boost.cms.issueTo.boostMyself" }