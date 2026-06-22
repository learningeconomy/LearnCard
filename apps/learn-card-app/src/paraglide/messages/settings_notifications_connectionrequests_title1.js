/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Settings_Notifications_Connectionrequests_Title1Inputs */

const en_settings_notifications_connectionrequests_title1 = /** @type {(inputs: Settings_Notifications_Connectionrequests_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New Connection Requests`)
};

const es_settings_notifications_connectionrequests_title1 = /** @type {(inputs: Settings_Notifications_Connectionrequests_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nuevas solicitudes de conexión`)
};

const fr_settings_notifications_connectionrequests_title1 = /** @type {(inputs: Settings_Notifications_Connectionrequests_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouvelles demandes de connexion`)
};

const ar_settings_notifications_connectionrequests_title1 = /** @type {(inputs: Settings_Notifications_Connectionrequests_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلبات الاتصال الجديدة`)
};

/**
* | output |
* | --- |
* | "New Connection Requests" |
*
* @param {Settings_Notifications_Connectionrequests_Title1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const settings_notifications_connectionrequests_title1 = /** @type {((inputs?: Settings_Notifications_Connectionrequests_Title1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Notifications_Connectionrequests_Title1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_notifications_connectionrequests_title1(inputs)
	if (locale === "es") return es_settings_notifications_connectionrequests_title1(inputs)
	if (locale === "fr") return fr_settings_notifications_connectionrequests_title1(inputs)
	return ar_settings_notifications_connectionrequests_title1(inputs)
});
export { settings_notifications_connectionrequests_title1 as "settings.notifications.connectionRequests.title" }