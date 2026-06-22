/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Activity_Notifpresentationrequest2Inputs */

const en_dashboard_activity_notifpresentationrequest2 = /** @type {(inputs: Dashboard_Activity_Notifpresentationrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Presentation requested`)
};

const es_dashboard_activity_notifpresentationrequest2 = /** @type {(inputs: Dashboard_Activity_Notifpresentationrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Presentación solicitada`)
};

const fr_dashboard_activity_notifpresentationrequest2 = /** @type {(inputs: Dashboard_Activity_Notifpresentationrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Présentation demandée`)
};

const ar_dashboard_activity_notifpresentationrequest2 = /** @type {(inputs: Dashboard_Activity_Notifpresentationrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم طلب عرض`)
};

/**
* | output |
* | --- |
* | "Presentation requested" |
*
* @param {Dashboard_Activity_Notifpresentationrequest2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_activity_notifpresentationrequest2 = /** @type {((inputs?: Dashboard_Activity_Notifpresentationrequest2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Activity_Notifpresentationrequest2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_activity_notifpresentationrequest2(inputs)
	if (locale === "es") return es_dashboard_activity_notifpresentationrequest2(inputs)
	if (locale === "fr") return fr_dashboard_activity_notifpresentationrequest2(inputs)
	return ar_dashboard_activity_notifpresentationrequest2(inputs)
});
export { dashboard_activity_notifpresentationrequest2 as "dashboard.activity.notifPresentationRequest" }