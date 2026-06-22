/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Title_Titleplaceholder1Inputs */

const en_boost_cms_title_titleplaceholder1 = /** @type {(inputs: Boost_Cms_Title_Titleplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Title`)
};

const es_boost_cms_title_titleplaceholder1 = /** @type {(inputs: Boost_Cms_Title_Titleplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Título`)
};

const fr_boost_cms_title_titleplaceholder1 = /** @type {(inputs: Boost_Cms_Title_Titleplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Titre`)
};

const ar_boost_cms_title_titleplaceholder1 = /** @type {(inputs: Boost_Cms_Title_Titleplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العنوان`)
};

/**
* | output |
* | --- |
* | "Title" |
*
* @param {Boost_Cms_Title_Titleplaceholder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_title_titleplaceholder1 = /** @type {((inputs?: Boost_Cms_Title_Titleplaceholder1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Title_Titleplaceholder1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_title_titleplaceholder1(inputs)
	if (locale === "es") return es_boost_cms_title_titleplaceholder1(inputs)
	if (locale === "fr") return fr_boost_cms_title_titleplaceholder1(inputs)
	return ar_boost_cms_title_titleplaceholder1(inputs)
});
export { boost_cms_title_titleplaceholder1 as "boost.cms.title.titlePlaceholder" }