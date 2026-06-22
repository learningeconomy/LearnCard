/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Dashboard_Title2Inputs */

const en_appstoreadmin_dashboard_title2 = /** @type {(inputs: Appstoreadmin_Dashboard_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Admin Dashboard`)
};

const es_appstoreadmin_dashboard_title2 = /** @type {(inputs: Appstoreadmin_Dashboard_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Panel de Administración`)
};

const fr_appstoreadmin_dashboard_title2 = /** @type {(inputs: Appstoreadmin_Dashboard_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tableau de Bord Administrateur`)
};

const ar_appstoreadmin_dashboard_title2 = /** @type {(inputs: Appstoreadmin_Dashboard_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لوحة تحكم المشرف`)
};

/**
* | output |
* | --- |
* | "Admin Dashboard" |
*
* @param {Appstoreadmin_Dashboard_Title2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_dashboard_title2 = /** @type {((inputs?: Appstoreadmin_Dashboard_Title2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Dashboard_Title2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_dashboard_title2(inputs)
	if (locale === "es") return es_appstoreadmin_dashboard_title2(inputs)
	if (locale === "fr") return fr_appstoreadmin_dashboard_title2(inputs)
	return ar_appstoreadmin_dashboard_title2(inputs)
});
export { appstoreadmin_dashboard_title2 as "appStoreAdmin.dashboard.title" }