/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Notifications_Notificationicon1Inputs */

const en_notifications_notificationicon1 = /** @type {(inputs: Notifications_Notificationicon1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`notification icon`)
};

const es_notifications_notificationicon1 = /** @type {(inputs: Notifications_Notificationicon1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`icono de notificación`)
};

const fr_notifications_notificationicon1 = /** @type {(inputs: Notifications_Notificationicon1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`icône de notification`)
};

const ar_notifications_notificationicon1 = /** @type {(inputs: Notifications_Notificationicon1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`notification icon`)
};

/**
* | output |
* | --- |
* | "notification icon" |
*
* @param {Notifications_Notificationicon1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const notifications_notificationicon1 = /** @type {((inputs?: Notifications_Notificationicon1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_Notificationicon1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_notifications_notificationicon1(inputs)
	if (locale === "es") return es_notifications_notificationicon1(inputs)
	if (locale === "fr") return fr_notifications_notificationicon1(inputs)
	return ar_notifications_notificationicon1(inputs)
});
export { notifications_notificationicon1 as "notifications.notificationIcon" }