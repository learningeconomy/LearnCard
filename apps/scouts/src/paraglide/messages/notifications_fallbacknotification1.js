/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Notifications_Fallbacknotification1Inputs */

const en_notifications_fallbacknotification1 = /** @type {(inputs: Notifications_Fallbacknotification1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Notification`)
};

const es_notifications_fallbacknotification1 = /** @type {(inputs: Notifications_Fallbacknotification1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Notificación`)
};

const fr_notifications_fallbacknotification1 = /** @type {(inputs: Notifications_Fallbacknotification1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Notification`)
};

const ar_notifications_fallbacknotification1 = /** @type {(inputs: Notifications_Fallbacknotification1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إشعار`)
};

/**
* | output |
* | --- |
* | "Notification" |
*
* @param {Notifications_Fallbacknotification1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const notifications_fallbacknotification1 = /** @type {((inputs?: Notifications_Fallbacknotification1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_Fallbacknotification1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_notifications_fallbacknotification1(inputs)
	if (locale === "es") return es_notifications_fallbacknotification1(inputs)
	if (locale === "fr") return fr_notifications_fallbacknotification1(inputs)
	return ar_notifications_fallbacknotification1(inputs)
});
export { notifications_fallbacknotification1 as "notifications.fallbackNotification" }