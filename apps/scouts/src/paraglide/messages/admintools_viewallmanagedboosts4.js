/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Viewallmanagedboosts4Inputs */

const en_admintools_viewallmanagedboosts4 = /** @type {(inputs: Admintools_Viewallmanagedboosts4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View All Managed Boosts and Badges`)
};

const es_admintools_viewallmanagedboosts4 = /** @type {(inputs: Admintools_Viewallmanagedboosts4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver Todos los Boosts e Insignias Gestionados`)
};

const fr_admintools_viewallmanagedboosts4 = /** @type {(inputs: Admintools_Viewallmanagedboosts4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir tous les Boosts et badges gérés`)
};

const ar_admintools_viewallmanagedboosts4 = /** @type {(inputs: Admintools_Viewallmanagedboosts4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض جميع التعزيزات والشارات المُدارة`)
};

/**
* | output |
* | --- |
* | "View All Managed Boosts and Badges" |
*
* @param {Admintools_Viewallmanagedboosts4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_viewallmanagedboosts4 = /** @type {((inputs?: Admintools_Viewallmanagedboosts4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Viewallmanagedboosts4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_viewallmanagedboosts4(inputs)
	if (locale === "es") return es_admintools_viewallmanagedboosts4(inputs)
	if (locale === "fr") return fr_admintools_viewallmanagedboosts4(inputs)
	return ar_admintools_viewallmanagedboosts4(inputs)
});
export { admintools_viewallmanagedboosts4 as "adminTools.viewAllManagedBoosts" }