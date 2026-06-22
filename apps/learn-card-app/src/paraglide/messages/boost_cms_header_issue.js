/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Header_IssueInputs */

const en_boost_cms_header_issue = /** @type {(inputs: Boost_Cms_Header_IssueInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue`)
};

const es_boost_cms_header_issue = /** @type {(inputs: Boost_Cms_Header_IssueInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emitir`)
};

const fr_boost_cms_header_issue = /** @type {(inputs: Boost_Cms_Header_IssueInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émettre`)
};

const ar_boost_cms_header_issue = /** @type {(inputs: Boost_Cms_Header_IssueInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إصدار`)
};

/**
* | output |
* | --- |
* | "Issue" |
*
* @param {Boost_Cms_Header_IssueInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_header_issue = /** @type {((inputs?: Boost_Cms_Header_IssueInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Header_IssueInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_header_issue(inputs)
	if (locale === "es") return es_boost_cms_header_issue(inputs)
	if (locale === "fr") return fr_boost_cms_header_issue(inputs)
	return ar_boost_cms_header_issue(inputs)
});
export { boost_cms_header_issue as "boost.cms.header.issue" }