/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Appearance_DefaultInputs */

const en_boost_cms_appearance_default = /** @type {(inputs: Boost_Cms_Appearance_DefaultInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Default`)
};

const es_boost_cms_appearance_default = /** @type {(inputs: Boost_Cms_Appearance_DefaultInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Predeterminado`)
};

const fr_boost_cms_appearance_default = /** @type {(inputs: Boost_Cms_Appearance_DefaultInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Par défaut`)
};

const ar_boost_cms_appearance_default = /** @type {(inputs: Boost_Cms_Appearance_DefaultInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`افتراضي`)
};

/**
* | output |
* | --- |
* | "Default" |
*
* @param {Boost_Cms_Appearance_DefaultInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_appearance_default = /** @type {((inputs?: Boost_Cms_Appearance_DefaultInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Appearance_DefaultInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_appearance_default(inputs)
	if (locale === "es") return es_boost_cms_appearance_default(inputs)
	if (locale === "fr") return fr_boost_cms_appearance_default(inputs)
	return ar_boost_cms_appearance_default(inputs)
});
export { boost_cms_appearance_default as "boost.cms.appearance.default" }