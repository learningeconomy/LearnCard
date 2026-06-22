/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ title: NonNullable<unknown> }} Boost_Cms_Advanced_Descriptionplaceholder1Inputs */

const en_boost_cms_advanced_descriptionplaceholder1 = /** @type {(inputs: Boost_Cms_Advanced_Descriptionplaceholder1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`What is this ${i?.title} for?`)
};

const es_boost_cms_advanced_descriptionplaceholder1 = /** @type {(inputs: Boost_Cms_Advanced_Descriptionplaceholder1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`¿Para qué es este/a ${i?.title}?`)
};

const fr_boost_cms_advanced_descriptionplaceholder1 = /** @type {(inputs: Boost_Cms_Advanced_Descriptionplaceholder1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`À quoi sert ce/cette ${i?.title} ?`)
};

const ar_boost_cms_advanced_descriptionplaceholder1 = /** @type {(inputs: Boost_Cms_Advanced_Descriptionplaceholder1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`ما الغرض من هذا ${i?.title}؟`)
};

/**
* | output |
* | --- |
* | "What is this {title} for?" |
*
* @param {Boost_Cms_Advanced_Descriptionplaceholder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_advanced_descriptionplaceholder1 = /** @type {((inputs: Boost_Cms_Advanced_Descriptionplaceholder1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Advanced_Descriptionplaceholder1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_advanced_descriptionplaceholder1(inputs)
	if (locale === "es") return es_boost_cms_advanced_descriptionplaceholder1(inputs)
	if (locale === "fr") return fr_boost_cms_advanced_descriptionplaceholder1(inputs)
	return ar_boost_cms_advanced_descriptionplaceholder1(inputs)
});
export { boost_cms_advanced_descriptionplaceholder1 as "boost.cms.advanced.descriptionPlaceholder" }