/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Basicinfo_Narrativeplaceholder2Inputs */

const en_boost_cms_basicinfo_narrativeplaceholder2 = /** @type {(inputs: Boost_Cms_Basicinfo_Narrativeplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`How do you earn this boost?`)
};

const es_boost_cms_basicinfo_narrativeplaceholder2 = /** @type {(inputs: Boost_Cms_Basicinfo_Narrativeplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Cómo se gana este boost?`)
};

const fr_boost_cms_basicinfo_narrativeplaceholder2 = /** @type {(inputs: Boost_Cms_Basicinfo_Narrativeplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Comment gagner ce boost ?`)
};

const ar_boost_cms_basicinfo_narrativeplaceholder2 = /** @type {(inputs: Boost_Cms_Basicinfo_Narrativeplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`كيف تكسب هذا البوست؟`)
};

/**
* | output |
* | --- |
* | "How do you earn this boost?" |
*
* @param {Boost_Cms_Basicinfo_Narrativeplaceholder2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_basicinfo_narrativeplaceholder2 = /** @type {((inputs?: Boost_Cms_Basicinfo_Narrativeplaceholder2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Basicinfo_Narrativeplaceholder2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_basicinfo_narrativeplaceholder2(inputs)
	if (locale === "es") return es_boost_cms_basicinfo_narrativeplaceholder2(inputs)
	if (locale === "fr") return fr_boost_cms_basicinfo_narrativeplaceholder2(inputs)
	return ar_boost_cms_basicinfo_narrativeplaceholder2(inputs)
});
export { boost_cms_basicinfo_narrativeplaceholder2 as "boost.cms.basicInfo.narrativePlaceholder" }