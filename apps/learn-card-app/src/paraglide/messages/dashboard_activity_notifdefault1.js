/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Activity_Notifdefault1Inputs */

const en_dashboard_activity_notifdefault1 = /** @type {(inputs: Dashboard_Activity_Notifdefault1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New notification`)
};

const es_dashboard_activity_notifdefault1 = /** @type {(inputs: Dashboard_Activity_Notifdefault1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nueva notificación`)
};

const fr_dashboard_activity_notifdefault1 = /** @type {(inputs: Dashboard_Activity_Notifdefault1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouvelle notification`)
};

const ar_dashboard_activity_notifdefault1 = /** @type {(inputs: Dashboard_Activity_Notifdefault1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إشعار جديد`)
};

/**
* | output |
* | --- |
* | "New notification" |
*
* @param {Dashboard_Activity_Notifdefault1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_activity_notifdefault1 = /** @type {((inputs?: Dashboard_Activity_Notifdefault1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Activity_Notifdefault1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_activity_notifdefault1(inputs)
	if (locale === "es") return es_dashboard_activity_notifdefault1(inputs)
	if (locale === "fr") return fr_dashboard_activity_notifdefault1(inputs)
	return ar_dashboard_activity_notifdefault1(inputs)
});
export { dashboard_activity_notifdefault1 as "dashboard.activity.notifDefault" }