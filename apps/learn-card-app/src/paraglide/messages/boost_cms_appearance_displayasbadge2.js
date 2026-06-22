/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ type: NonNullable<unknown> }} Boost_Cms_Appearance_Displayasbadge2Inputs */

const en_boost_cms_appearance_displayasbadge2 = /** @type {(inputs: Boost_Cms_Appearance_Displayasbadge2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Display as ${i?.type}`)
};

const es_boost_cms_appearance_displayasbadge2 = /** @type {(inputs: Boost_Cms_Appearance_Displayasbadge2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Mostrar como ${i?.type}`)
};

const fr_boost_cms_appearance_displayasbadge2 = /** @type {(inputs: Boost_Cms_Appearance_Displayasbadge2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Afficher comme ${i?.type}`)
};

const ar_boost_cms_appearance_displayasbadge2 = /** @type {(inputs: Boost_Cms_Appearance_Displayasbadge2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`عرض كـ ${i?.type}`)
};

/**
* | output |
* | --- |
* | "Display as {type}" |
*
* @param {Boost_Cms_Appearance_Displayasbadge2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_appearance_displayasbadge2 = /** @type {((inputs: Boost_Cms_Appearance_Displayasbadge2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Appearance_Displayasbadge2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_appearance_displayasbadge2(inputs)
	if (locale === "es") return es_boost_cms_appearance_displayasbadge2(inputs)
	if (locale === "fr") return fr_boost_cms_appearance_displayasbadge2(inputs)
	return ar_boost_cms_appearance_displayasbadge2(inputs)
});
export { boost_cms_appearance_displayasbadge2 as "boost.cms.appearance.displayAsBadge" }