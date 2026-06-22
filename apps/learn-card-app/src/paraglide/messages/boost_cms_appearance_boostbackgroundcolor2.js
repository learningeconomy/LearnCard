/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Appearance_Boostbackgroundcolor2Inputs */

const en_boost_cms_appearance_boostbackgroundcolor2 = /** @type {(inputs: Boost_Cms_Appearance_Boostbackgroundcolor2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost Background Color`)
};

const es_boost_cms_appearance_boostbackgroundcolor2 = /** @type {(inputs: Boost_Cms_Appearance_Boostbackgroundcolor2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Color de fondo del boost`)
};

const fr_boost_cms_appearance_boostbackgroundcolor2 = /** @type {(inputs: Boost_Cms_Appearance_Boostbackgroundcolor2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Couleur de fond du boost`)
};

const ar_boost_cms_appearance_boostbackgroundcolor2 = /** @type {(inputs: Boost_Cms_Appearance_Boostbackgroundcolor2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لون خلفية البوست`)
};

/**
* | output |
* | --- |
* | "Boost Background Color" |
*
* @param {Boost_Cms_Appearance_Boostbackgroundcolor2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_appearance_boostbackgroundcolor2 = /** @type {((inputs?: Boost_Cms_Appearance_Boostbackgroundcolor2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Appearance_Boostbackgroundcolor2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_appearance_boostbackgroundcolor2(inputs)
	if (locale === "es") return es_boost_cms_appearance_boostbackgroundcolor2(inputs)
	if (locale === "fr") return fr_boost_cms_appearance_boostbackgroundcolor2(inputs)
	return ar_boost_cms_appearance_boostbackgroundcolor2(inputs)
});
export { boost_cms_appearance_boostbackgroundcolor2 as "boost.cms.appearance.boostBackgroundColor" }