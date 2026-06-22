/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Template_Browsetemplates1Inputs */

const en_boost_template_browsetemplates1 = /** @type {(inputs: Boost_Template_Browsetemplates1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Browse templates...`)
};

const es_boost_template_browsetemplates1 = /** @type {(inputs: Boost_Template_Browsetemplates1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explorar plantillas...`)
};

const fr_boost_template_browsetemplates1 = /** @type {(inputs: Boost_Template_Browsetemplates1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Parcourir les modèles...`)
};

const ar_boost_template_browsetemplates1 = /** @type {(inputs: Boost_Template_Browsetemplates1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تصفّح القوالب...`)
};

/**
* | output |
* | --- |
* | "Browse templates..." |
*
* @param {Boost_Template_Browsetemplates1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_template_browsetemplates1 = /** @type {((inputs?: Boost_Template_Browsetemplates1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Template_Browsetemplates1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_template_browsetemplates1(inputs)
	if (locale === "es") return es_boost_template_browsetemplates1(inputs)
	if (locale === "fr") return fr_boost_template_browsetemplates1(inputs)
	return ar_boost_template_browsetemplates1(inputs)
});
export { boost_template_browsetemplates1 as "boost.template.browseTemplates" }