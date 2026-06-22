/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ type: NonNullable<unknown> }} Boost_Cms_Appearance_Displaytype1Inputs */

const en_boost_cms_appearance_displaytype1 = /** @type {(inputs: Boost_Cms_Appearance_Displaytype1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.type} Display`)
};

const es_boost_cms_appearance_displaytype1 = /** @type {(inputs: Boost_Cms_Appearance_Displaytype1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Visualización ${i?.type}`)
};

const fr_boost_cms_appearance_displaytype1 = /** @type {(inputs: Boost_Cms_Appearance_Displaytype1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Affichage ${i?.type}`)
};

const ar_boost_cms_appearance_displaytype1 = /** @type {(inputs: Boost_Cms_Appearance_Displaytype1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`عرض ${i?.type}`)
};

/**
* | output |
* | --- |
* | "{type} Display" |
*
* @param {Boost_Cms_Appearance_Displaytype1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_appearance_displaytype1 = /** @type {((inputs: Boost_Cms_Appearance_Displaytype1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Appearance_Displaytype1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_appearance_displaytype1(inputs)
	if (locale === "es") return es_boost_cms_appearance_displaytype1(inputs)
	if (locale === "fr") return fr_boost_cms_appearance_displaytype1(inputs)
	return ar_boost_cms_appearance_displaytype1(inputs)
});
export { boost_cms_appearance_displaytype1 as "boost.cms.appearance.displayType" }