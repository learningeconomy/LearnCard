/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Dashboard_Selectapp3Inputs */

const en_appstoreadmin_dashboard_selectapp3 = /** @type {(inputs: Appstoreadmin_Dashboard_Selectapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select an app to review`)
};

const es_appstoreadmin_dashboard_selectapp3 = /** @type {(inputs: Appstoreadmin_Dashboard_Selectapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selecciona una app para revisar`)
};

const fr_appstoreadmin_dashboard_selectapp3 = /** @type {(inputs: Appstoreadmin_Dashboard_Selectapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionnez une application à examiner`)
};

const ar_appstoreadmin_dashboard_selectapp3 = /** @type {(inputs: Appstoreadmin_Dashboard_Selectapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر تطبيقًا للمراجعة`)
};

/**
* | output |
* | --- |
* | "Select an app to review" |
*
* @param {Appstoreadmin_Dashboard_Selectapp3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_dashboard_selectapp3 = /** @type {((inputs?: Appstoreadmin_Dashboard_Selectapp3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Dashboard_Selectapp3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_dashboard_selectapp3(inputs)
	if (locale === "es") return es_appstoreadmin_dashboard_selectapp3(inputs)
	if (locale === "fr") return fr_appstoreadmin_dashboard_selectapp3(inputs)
	return ar_appstoreadmin_dashboard_selectapp3(inputs)
});
export { appstoreadmin_dashboard_selectapp3 as "appStoreAdmin.dashboard.selectApp" }