/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Activity_Notifboostreceived2Inputs */

const en_dashboard_activity_notifboostreceived2 = /** @type {(inputs: Dashboard_Activity_Notifboostreceived2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New credential available`)
};

const es_dashboard_activity_notifboostreceived2 = /** @type {(inputs: Dashboard_Activity_Notifboostreceived2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nueva credencial disponible`)
};

const fr_dashboard_activity_notifboostreceived2 = /** @type {(inputs: Dashboard_Activity_Notifboostreceived2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouvelle certification disponible`)
};

const ar_dashboard_activity_notifboostreceived2 = /** @type {(inputs: Dashboard_Activity_Notifboostreceived2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شهادة جديدة متاحة`)
};

/**
* | output |
* | --- |
* | "New credential available" |
*
* @param {Dashboard_Activity_Notifboostreceived2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_activity_notifboostreceived2 = /** @type {((inputs?: Dashboard_Activity_Notifboostreceived2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Activity_Notifboostreceived2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_activity_notifboostreceived2(inputs)
	if (locale === "es") return es_dashboard_activity_notifboostreceived2(inputs)
	if (locale === "fr") return fr_dashboard_activity_notifboostreceived2(inputs)
	return ar_dashboard_activity_notifboostreceived2(inputs)
});
export { dashboard_activity_notifboostreceived2 as "dashboard.activity.notifBoostReceived" }