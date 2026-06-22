/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Sidebar_Refresh2Inputs */

const en_appstoreadmin_sidebar_refresh2 = /** @type {(inputs: Appstoreadmin_Sidebar_Refresh2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Refresh`)
};

const es_appstoreadmin_sidebar_refresh2 = /** @type {(inputs: Appstoreadmin_Sidebar_Refresh2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actualizar`)
};

const fr_appstoreadmin_sidebar_refresh2 = /** @type {(inputs: Appstoreadmin_Sidebar_Refresh2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actualiser`)
};

const ar_appstoreadmin_sidebar_refresh2 = /** @type {(inputs: Appstoreadmin_Sidebar_Refresh2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحديث`)
};

/**
* | output |
* | --- |
* | "Refresh" |
*
* @param {Appstoreadmin_Sidebar_Refresh2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_sidebar_refresh2 = /** @type {((inputs?: Appstoreadmin_Sidebar_Refresh2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Sidebar_Refresh2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_sidebar_refresh2(inputs)
	if (locale === "es") return es_appstoreadmin_sidebar_refresh2(inputs)
	if (locale === "fr") return fr_appstoreadmin_sidebar_refresh2(inputs)
	return ar_appstoreadmin_sidebar_refresh2(inputs)
});
export { appstoreadmin_sidebar_refresh2 as "appStoreAdmin.sidebar.refresh" }