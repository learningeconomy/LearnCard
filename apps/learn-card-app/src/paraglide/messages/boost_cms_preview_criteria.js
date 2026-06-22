/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Preview_CriteriaInputs */

const en_boost_cms_preview_criteria = /** @type {(inputs: Boost_Cms_Preview_CriteriaInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Criteria`)
};

const es_boost_cms_preview_criteria = /** @type {(inputs: Boost_Cms_Preview_CriteriaInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Criterios`)
};

const fr_boost_cms_preview_criteria = /** @type {(inputs: Boost_Cms_Preview_CriteriaInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Critères`)
};

const ar_boost_cms_preview_criteria = /** @type {(inputs: Boost_Cms_Preview_CriteriaInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المعايير`)
};

/**
* | output |
* | --- |
* | "Criteria" |
*
* @param {Boost_Cms_Preview_CriteriaInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_preview_criteria = /** @type {((inputs?: Boost_Cms_Preview_CriteriaInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Preview_CriteriaInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_preview_criteria(inputs)
	if (locale === "es") return es_boost_cms_preview_criteria(inputs)
	if (locale === "fr") return fr_boost_cms_preview_criteria(inputs)
	return ar_boost_cms_preview_criteria(inputs)
});
export { boost_cms_preview_criteria as "boost.cms.preview.criteria" }