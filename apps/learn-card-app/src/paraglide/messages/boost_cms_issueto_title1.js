/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Issueto_Title1Inputs */

const en_boost_cms_issueto_title1 = /** @type {(inputs: Boost_Cms_Issueto_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue To`)
};

const es_boost_cms_issueto_title1 = /** @type {(inputs: Boost_Cms_Issueto_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emitir a`)
};

const fr_boost_cms_issueto_title1 = /** @type {(inputs: Boost_Cms_Issueto_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émettre à`)
};

const ar_boost_cms_issueto_title1 = /** @type {(inputs: Boost_Cms_Issueto_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إصدار إلى`)
};

/**
* | output |
* | --- |
* | "Issue To" |
*
* @param {Boost_Cms_Issueto_Title1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_issueto_title1 = /** @type {((inputs?: Boost_Cms_Issueto_Title1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Issueto_Title1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_issueto_title1(inputs)
	if (locale === "es") return es_boost_cms_issueto_title1(inputs)
	if (locale === "fr") return fr_boost_cms_issueto_title1(inputs)
	return ar_boost_cms_issueto_title1(inputs)
});
export { boost_cms_issueto_title1 as "boost.cms.issueTo.title" }