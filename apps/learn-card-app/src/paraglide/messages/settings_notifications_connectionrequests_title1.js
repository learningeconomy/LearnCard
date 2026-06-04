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

const de_settings_notifications_connectionrequests_title1 = /** @type {(inputs: Settings_Notifications_Connectionrequests_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Neue Verbindungsanfragen`)
};

const ar_settings_notifications_connectionrequests_title1 = /** @type {(inputs: Settings_Notifications_Connectionrequests_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلبات الاتصال الجديدة`)
};

const fr_settings_notifications_connectionrequests_title1 = /** @type {(inputs: Settings_Notifications_Connectionrequests_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouvelles demandes de connexion`)
};

const ko_settings_notifications_connectionrequests_title1 = /** @type {(inputs: Settings_Notifications_Connectionrequests_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`새로운 연결 요청`)
};

/**
* | output |
* | --- |
* | "New Connection Requests" |
*
* @param {Settings_Notifications_Connectionrequests_Title1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const settings_notifications_connectionrequests_title1 = /** @type {((inputs?: Settings_Notifications_Connectionrequests_Title1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Notifications_Connectionrequests_Title1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_notifications_connectionrequests_title1(inputs)
	if (locale === "es") return es_settings_notifications_connectionrequests_title1(inputs)
	if (locale === "de") return de_settings_notifications_connectionrequests_title1(inputs)
	if (locale === "ar") return ar_settings_notifications_connectionrequests_title1(inputs)
	if (locale === "fr") return fr_settings_notifications_connectionrequests_title1(inputs)
	return ko_settings_notifications_connectionrequests_title1(inputs)
});
export { settings_notifications_connectionrequests_title1 as "settings.notifications.connectionRequests.title" }