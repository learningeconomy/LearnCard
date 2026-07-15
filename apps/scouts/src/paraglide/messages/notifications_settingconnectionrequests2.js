/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Notifications_Settingconnectionrequests2Inputs */

const en_notifications_settingconnectionrequests2 = /** @type {(inputs: Notifications_Settingconnectionrequests2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New Connection Requests`)
};

const es_notifications_settingconnectionrequests2 = /** @type {(inputs: Notifications_Settingconnectionrequests2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nuevas Solicitudes de Conexión`)
};

const fr_notifications_settingconnectionrequests2 = /** @type {(inputs: Notifications_Settingconnectionrequests2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouvelles demandes de connexion`)
};

const ar_notifications_settingconnectionrequests2 = /** @type {(inputs: Notifications_Settingconnectionrequests2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلبات الاتصال الجديدة`)
};

/**
* | output |
* | --- |
* | "New Connection Requests" |
*
* @param {Notifications_Settingconnectionrequests2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const notifications_settingconnectionrequests2 = /** @type {((inputs?: Notifications_Settingconnectionrequests2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_Settingconnectionrequests2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_notifications_settingconnectionrequests2(inputs)
	if (locale === "es") return es_notifications_settingconnectionrequests2(inputs)
	if (locale === "fr") return fr_notifications_settingconnectionrequests2(inputs)
	return ar_notifications_settingconnectionrequests2(inputs)
});
export { notifications_settingconnectionrequests2 as "notifications.settingConnectionRequests" }