/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Sidebar_Backtolistings4Inputs */

const en_appstoreadmin_sidebar_backtolistings4 = /** @type {(inputs: Appstoreadmin_Sidebar_Backtolistings4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Back to listings`)
};

const es_appstoreadmin_sidebar_backtolistings4 = /** @type {(inputs: Appstoreadmin_Sidebar_Backtolistings4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Volver a listados`)
};

const fr_appstoreadmin_sidebar_backtolistings4 = /** @type {(inputs: Appstoreadmin_Sidebar_Backtolistings4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retour aux annonces`)
};

const ar_appstoreadmin_sidebar_backtolistings4 = /** @type {(inputs: Appstoreadmin_Sidebar_Backtolistings4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العودة إلى القوائم`)
};

/**
* | output |
* | --- |
* | "Back to listings" |
*
* @param {Appstoreadmin_Sidebar_Backtolistings4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_sidebar_backtolistings4 = /** @type {((inputs?: Appstoreadmin_Sidebar_Backtolistings4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Sidebar_Backtolistings4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_sidebar_backtolistings4(inputs)
	if (locale === "es") return es_appstoreadmin_sidebar_backtolistings4(inputs)
	if (locale === "fr") return fr_appstoreadmin_sidebar_backtolistings4(inputs)
	return ar_appstoreadmin_sidebar_backtolistings4(inputs)
});
export { appstoreadmin_sidebar_backtolistings4 as "appStoreAdmin.sidebar.backToListings" }