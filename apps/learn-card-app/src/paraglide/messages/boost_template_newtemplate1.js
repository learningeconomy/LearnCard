/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Template_Newtemplate1Inputs */

const en_boost_template_newtemplate1 = /** @type {(inputs: Boost_Template_Newtemplate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New Template`)
};

const es_boost_template_newtemplate1 = /** @type {(inputs: Boost_Template_Newtemplate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nueva plantilla`)
};

const fr_boost_template_newtemplate1 = /** @type {(inputs: Boost_Template_Newtemplate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouveau modèle`)
};

const ar_boost_template_newtemplate1 = /** @type {(inputs: Boost_Template_Newtemplate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قالب جديد`)
};

/**
* | output |
* | --- |
* | "New Template" |
*
* @param {Boost_Template_Newtemplate1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_template_newtemplate1 = /** @type {((inputs?: Boost_Template_Newtemplate1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Template_Newtemplate1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_template_newtemplate1(inputs)
	if (locale === "es") return es_boost_template_newtemplate1(inputs)
	if (locale === "fr") return fr_boost_template_newtemplate1(inputs)
	return ar_boost_template_newtemplate1(inputs)
});
export { boost_template_newtemplate1 as "boost.template.newTemplate" }