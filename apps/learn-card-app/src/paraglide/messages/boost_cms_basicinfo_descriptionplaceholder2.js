/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Basicinfo_Descriptionplaceholder2Inputs */

const en_boost_cms_basicinfo_descriptionplaceholder2 = /** @type {(inputs: Boost_Cms_Basicinfo_Descriptionplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What is this boost for?`)
};

const es_boost_cms_basicinfo_descriptionplaceholder2 = /** @type {(inputs: Boost_Cms_Basicinfo_Descriptionplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Para qué es este boost?`)
};

const fr_boost_cms_basicinfo_descriptionplaceholder2 = /** @type {(inputs: Boost_Cms_Basicinfo_Descriptionplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`À quoi sert ce boost ?`)
};

const ar_boost_cms_basicinfo_descriptionplaceholder2 = /** @type {(inputs: Boost_Cms_Basicinfo_Descriptionplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ما الغرض من هذا البوست؟`)
};

/**
* | output |
* | --- |
* | "What is this boost for?" |
*
* @param {Boost_Cms_Basicinfo_Descriptionplaceholder2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_basicinfo_descriptionplaceholder2 = /** @type {((inputs?: Boost_Cms_Basicinfo_Descriptionplaceholder2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Basicinfo_Descriptionplaceholder2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_basicinfo_descriptionplaceholder2(inputs)
	if (locale === "es") return es_boost_cms_basicinfo_descriptionplaceholder2(inputs)
	if (locale === "fr") return fr_boost_cms_basicinfo_descriptionplaceholder2(inputs)
	return ar_boost_cms_basicinfo_descriptionplaceholder2(inputs)
});
export { boost_cms_basicinfo_descriptionplaceholder2 as "boost.cms.basicInfo.descriptionPlaceholder" }