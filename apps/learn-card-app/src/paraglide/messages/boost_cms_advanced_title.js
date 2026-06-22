/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Advanced_TitleInputs */

const en_boost_cms_advanced_title = /** @type {(inputs: Boost_Cms_Advanced_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Advanced Settings`)
};

const es_boost_cms_advanced_title = /** @type {(inputs: Boost_Cms_Advanced_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configuración avanzada`)
};

const fr_boost_cms_advanced_title = /** @type {(inputs: Boost_Cms_Advanced_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Paramètres avancés`)
};

const ar_boost_cms_advanced_title = /** @type {(inputs: Boost_Cms_Advanced_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إعدادات متقدمة`)
};

/**
* | output |
* | --- |
* | "Advanced Settings" |
*
* @param {Boost_Cms_Advanced_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_advanced_title = /** @type {((inputs?: Boost_Cms_Advanced_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Advanced_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_advanced_title(inputs)
	if (locale === "es") return es_boost_cms_advanced_title(inputs)
	if (locale === "fr") return fr_boost_cms_advanced_title(inputs)
	return ar_boost_cms_advanced_title(inputs)
});
export { boost_cms_advanced_title as "boost.cms.advanced.title" }