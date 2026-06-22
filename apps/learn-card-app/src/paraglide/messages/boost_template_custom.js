/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Template_CustomInputs */

const en_boost_template_custom = /** @type {(inputs: Boost_Template_CustomInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Custom`)
};

const es_boost_template_custom = /** @type {(inputs: Boost_Template_CustomInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personalizado`)
};

const fr_boost_template_custom = /** @type {(inputs: Boost_Template_CustomInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personnalisé`)
};

const ar_boost_template_custom = /** @type {(inputs: Boost_Template_CustomInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مخصّص`)
};

/**
* | output |
* | --- |
* | "Custom" |
*
* @param {Boost_Template_CustomInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_template_custom = /** @type {((inputs?: Boost_Template_CustomInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Template_CustomInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_template_custom(inputs)
	if (locale === "es") return es_boost_template_custom(inputs)
	if (locale === "fr") return fr_boost_template_custom(inputs)
	return ar_boost_template_custom(inputs)
});
export { boost_template_custom as "boost.template.custom" }