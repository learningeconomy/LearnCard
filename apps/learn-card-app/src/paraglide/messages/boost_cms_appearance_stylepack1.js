/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Appearance_Stylepack1Inputs */

const en_boost_cms_appearance_stylepack1 = /** @type {(inputs: Boost_Cms_Appearance_Stylepack1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Style Pack`)
};

const es_boost_cms_appearance_stylepack1 = /** @type {(inputs: Boost_Cms_Appearance_Stylepack1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Paquete de estilos`)
};

const fr_boost_cms_appearance_stylepack1 = /** @type {(inputs: Boost_Cms_Appearance_Stylepack1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pack de styles`)
};

const ar_boost_cms_appearance_stylepack1 = /** @type {(inputs: Boost_Cms_Appearance_Stylepack1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حزمة الأنماط`)
};

/**
* | output |
* | --- |
* | "Style Pack" |
*
* @param {Boost_Cms_Appearance_Stylepack1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_appearance_stylepack1 = /** @type {((inputs?: Boost_Cms_Appearance_Stylepack1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Appearance_Stylepack1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_appearance_stylepack1(inputs)
	if (locale === "es") return es_boost_cms_appearance_stylepack1(inputs)
	if (locale === "fr") return fr_boost_cms_appearance_stylepack1(inputs)
	return ar_boost_cms_appearance_stylepack1(inputs)
});
export { boost_cms_appearance_stylepack1 as "boost.cms.appearance.stylePack" }