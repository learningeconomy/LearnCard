/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Title_Boosttitleplaceholder2Inputs */

const en_boost_cms_title_boosttitleplaceholder2 = /** @type {(inputs: Boost_Cms_Title_Boosttitleplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost Title`)
};

const es_boost_cms_title_boosttitleplaceholder2 = /** @type {(inputs: Boost_Cms_Title_Boosttitleplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Título del boost`)
};

const fr_boost_cms_title_boosttitleplaceholder2 = /** @type {(inputs: Boost_Cms_Title_Boosttitleplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Titre du boost`)
};

const ar_boost_cms_title_boosttitleplaceholder2 = /** @type {(inputs: Boost_Cms_Title_Boosttitleplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عنوان البوست`)
};

/**
* | output |
* | --- |
* | "Boost Title" |
*
* @param {Boost_Cms_Title_Boosttitleplaceholder2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_title_boosttitleplaceholder2 = /** @type {((inputs?: Boost_Cms_Title_Boosttitleplaceholder2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Title_Boosttitleplaceholder2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_title_boosttitleplaceholder2(inputs)
	if (locale === "es") return es_boost_cms_title_boosttitleplaceholder2(inputs)
	if (locale === "fr") return fr_boost_cms_title_boosttitleplaceholder2(inputs)
	return ar_boost_cms_title_boosttitleplaceholder2(inputs)
});
export { boost_cms_title_boosttitleplaceholder2 as "boost.cms.title.boostTitlePlaceholder" }