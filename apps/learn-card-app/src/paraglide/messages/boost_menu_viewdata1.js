/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Menu_Viewdata1Inputs */

const en_boost_menu_viewdata1 = /** @type {(inputs: Boost_Menu_Viewdata1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View Data`)
};

const es_boost_menu_viewdata1 = /** @type {(inputs: Boost_Menu_Viewdata1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver datos`)
};

const fr_boost_menu_viewdata1 = /** @type {(inputs: Boost_Menu_Viewdata1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir les données`)
};

const ar_boost_menu_viewdata1 = /** @type {(inputs: Boost_Menu_Viewdata1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض البيانات`)
};

/**
* | output |
* | --- |
* | "View Data" |
*
* @param {Boost_Menu_Viewdata1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_menu_viewdata1 = /** @type {((inputs?: Boost_Menu_Viewdata1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Menu_Viewdata1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_menu_viewdata1(inputs)
	if (locale === "es") return es_boost_menu_viewdata1(inputs)
	if (locale === "fr") return fr_boost_menu_viewdata1(inputs)
	return ar_boost_menu_viewdata1(inputs)
});
export { boost_menu_viewdata1 as "boost.menu.viewData" }