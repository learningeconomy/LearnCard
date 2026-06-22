/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Dashboard_Accessdenied3Inputs */

const en_appstoreadmin_dashboard_accessdenied3 = /** @type {(inputs: Appstoreadmin_Dashboard_Accessdenied3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Access Denied`)
};

const es_appstoreadmin_dashboard_accessdenied3 = /** @type {(inputs: Appstoreadmin_Dashboard_Accessdenied3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Acceso Denegado`)
};

const fr_appstoreadmin_dashboard_accessdenied3 = /** @type {(inputs: Appstoreadmin_Dashboard_Accessdenied3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accès Refusé`)
};

const ar_appstoreadmin_dashboard_accessdenied3 = /** @type {(inputs: Appstoreadmin_Dashboard_Accessdenied3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم رفض الوصول`)
};

/**
* | output |
* | --- |
* | "Access Denied" |
*
* @param {Appstoreadmin_Dashboard_Accessdenied3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_dashboard_accessdenied3 = /** @type {((inputs?: Appstoreadmin_Dashboard_Accessdenied3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Dashboard_Accessdenied3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_dashboard_accessdenied3(inputs)
	if (locale === "es") return es_appstoreadmin_dashboard_accessdenied3(inputs)
	if (locale === "fr") return fr_appstoreadmin_dashboard_accessdenied3(inputs)
	return ar_appstoreadmin_dashboard_accessdenied3(inputs)
});
export { appstoreadmin_dashboard_accessdenied3 as "appStoreAdmin.dashboard.accessDenied" }