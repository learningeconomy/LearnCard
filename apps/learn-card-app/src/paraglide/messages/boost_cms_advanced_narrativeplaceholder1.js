/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ title: NonNullable<unknown> }} Boost_Cms_Advanced_Narrativeplaceholder1Inputs */

const en_boost_cms_advanced_narrativeplaceholder1 = /** @type {(inputs: Boost_Cms_Advanced_Narrativeplaceholder1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`How do you earn this ${i?.title}?`)
};

const es_boost_cms_advanced_narrativeplaceholder1 = /** @type {(inputs: Boost_Cms_Advanced_Narrativeplaceholder1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`¿Cómo se gana este/a ${i?.title}?`)
};

const fr_boost_cms_advanced_narrativeplaceholder1 = /** @type {(inputs: Boost_Cms_Advanced_Narrativeplaceholder1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Comment gagner ce/cette ${i?.title} ?`)
};

const ar_boost_cms_advanced_narrativeplaceholder1 = /** @type {(inputs: Boost_Cms_Advanced_Narrativeplaceholder1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`كيف تكسب هذا ${i?.title}؟`)
};

/**
* | output |
* | --- |
* | "How do you earn this {title}?" |
*
* @param {Boost_Cms_Advanced_Narrativeplaceholder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_advanced_narrativeplaceholder1 = /** @type {((inputs: Boost_Cms_Advanced_Narrativeplaceholder1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Advanced_Narrativeplaceholder1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_advanced_narrativeplaceholder1(inputs)
	if (locale === "es") return es_boost_cms_advanced_narrativeplaceholder1(inputs)
	if (locale === "fr") return fr_boost_cms_advanced_narrativeplaceholder1(inputs)
	return ar_boost_cms_advanced_narrativeplaceholder1(inputs)
});
export { boost_cms_advanced_narrativeplaceholder1 as "boost.cms.advanced.narrativePlaceholder" }