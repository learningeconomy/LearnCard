/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Dashboard_Choosefromsidebar4Inputs */

const en_appstoreadmin_dashboard_choosefromsidebar4 = /** @type {(inputs: Appstoreadmin_Dashboard_Choosefromsidebar4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choose a listing from the sidebar`)
};

const es_appstoreadmin_dashboard_choosefromsidebar4 = /** @type {(inputs: Appstoreadmin_Dashboard_Choosefromsidebar4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Elige un listado de la barra lateral`)
};

const fr_appstoreadmin_dashboard_choosefromsidebar4 = /** @type {(inputs: Appstoreadmin_Dashboard_Choosefromsidebar4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choisissez une annonce dans la barre latérale`)
};

const ar_appstoreadmin_dashboard_choosefromsidebar4 = /** @type {(inputs: Appstoreadmin_Dashboard_Choosefromsidebar4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر قائمة من الشريط الجانبي`)
};

/**
* | output |
* | --- |
* | "Choose a listing from the sidebar" |
*
* @param {Appstoreadmin_Dashboard_Choosefromsidebar4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_dashboard_choosefromsidebar4 = /** @type {((inputs?: Appstoreadmin_Dashboard_Choosefromsidebar4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Dashboard_Choosefromsidebar4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_dashboard_choosefromsidebar4(inputs)
	if (locale === "es") return es_appstoreadmin_dashboard_choosefromsidebar4(inputs)
	if (locale === "fr") return fr_appstoreadmin_dashboard_choosefromsidebar4(inputs)
	return ar_appstoreadmin_dashboard_choosefromsidebar4(inputs)
});
export { appstoreadmin_dashboard_choosefromsidebar4 as "appStoreAdmin.dashboard.chooseFromSidebar" }