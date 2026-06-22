/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown> }} Boost_Template_Brandtemplate1Inputs */

const en_boost_template_brandtemplate1 = /** @type {(inputs: Boost_Template_Brandtemplate1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.brand} Template`)
};

const es_boost_template_brandtemplate1 = /** @type {(inputs: Boost_Template_Brandtemplate1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Plantilla de ${i?.brand}`)
};

const fr_boost_template_brandtemplate1 = /** @type {(inputs: Boost_Template_Brandtemplate1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Modèle ${i?.brand}`)
};

const ar_boost_template_brandtemplate1 = /** @type {(inputs: Boost_Template_Brandtemplate1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`قالب ${i?.brand}`)
};

/**
* | output |
* | --- |
* | "{brand} Template" |
*
* @param {Boost_Template_Brandtemplate1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_template_brandtemplate1 = /** @type {((inputs: Boost_Template_Brandtemplate1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Template_Brandtemplate1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_template_brandtemplate1(inputs)
	if (locale === "es") return es_boost_template_brandtemplate1(inputs)
	if (locale === "fr") return fr_boost_template_brandtemplate1(inputs)
	return ar_boost_template_brandtemplate1(inputs)
});
export { boost_template_brandtemplate1 as "boost.template.brandTemplate" }