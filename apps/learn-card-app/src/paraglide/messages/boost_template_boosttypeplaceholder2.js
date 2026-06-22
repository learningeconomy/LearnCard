/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Template_Boosttypeplaceholder2Inputs */

const en_boost_template_boosttypeplaceholder2 = /** @type {(inputs: Boost_Template_Boosttypeplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost type...`)
};

const es_boost_template_boosttypeplaceholder2 = /** @type {(inputs: Boost_Template_Boosttypeplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tipo de Boost...`)
};

const fr_boost_template_boosttypeplaceholder2 = /** @type {(inputs: Boost_Template_Boosttypeplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Type de Boost...`)
};

const ar_boost_template_boosttypeplaceholder2 = /** @type {(inputs: Boost_Template_Boosttypeplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نوع Boost...`)
};

/**
* | output |
* | --- |
* | "Boost type..." |
*
* @param {Boost_Template_Boosttypeplaceholder2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_template_boosttypeplaceholder2 = /** @type {((inputs?: Boost_Template_Boosttypeplaceholder2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Template_Boosttypeplaceholder2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_template_boosttypeplaceholder2(inputs)
	if (locale === "es") return es_boost_template_boosttypeplaceholder2(inputs)
	if (locale === "fr") return fr_boost_template_boosttypeplaceholder2(inputs)
	return ar_boost_template_boosttypeplaceholder2(inputs)
});
export { boost_template_boosttypeplaceholder2 as "boost.template.boostTypePlaceholder" }