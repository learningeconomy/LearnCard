/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Activity_Notifcredentialreceived2Inputs */

const en_dashboard_activity_notifcredentialreceived2 = /** @type {(inputs: Dashboard_Activity_Notifcredentialreceived2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential received`)
};

const es_dashboard_activity_notifcredentialreceived2 = /** @type {(inputs: Dashboard_Activity_Notifcredentialreceived2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credencial recibida`)
};

const fr_dashboard_activity_notifcredentialreceived2 = /** @type {(inputs: Dashboard_Activity_Notifcredentialreceived2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Certification reçue`)
};

const ar_dashboard_activity_notifcredentialreceived2 = /** @type {(inputs: Dashboard_Activity_Notifcredentialreceived2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم استلام شهادة`)
};

/**
* | output |
* | --- |
* | "Credential received" |
*
* @param {Dashboard_Activity_Notifcredentialreceived2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_activity_notifcredentialreceived2 = /** @type {((inputs?: Dashboard_Activity_Notifcredentialreceived2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Activity_Notifcredentialreceived2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_activity_notifcredentialreceived2(inputs)
	if (locale === "es") return es_dashboard_activity_notifcredentialreceived2(inputs)
	if (locale === "fr") return fr_dashboard_activity_notifcredentialreceived2(inputs)
	return ar_dashboard_activity_notifcredentialreceived2(inputs)
});
export { dashboard_activity_notifcredentialreceived2 as "dashboard.activity.notifCredentialReceived" }