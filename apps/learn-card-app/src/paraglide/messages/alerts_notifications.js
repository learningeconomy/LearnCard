/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Alerts_NotificationsInputs */

const en_alerts_notifications = /** @type {(inputs: Alerts_NotificationsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Notifications`)
};

const es_alerts_notifications = /** @type {(inputs: Alerts_NotificationsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Notificaciones`)
};

const de_alerts_notifications = /** @type {(inputs: Alerts_NotificationsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mitteilungen`)
};

const ar_alerts_notifications = /** @type {(inputs: Alerts_NotificationsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الإشعارات`)
};

const fr_alerts_notifications = /** @type {(inputs: Alerts_NotificationsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Notifications`)
};

const ko_alerts_notifications = /** @type {(inputs: Alerts_NotificationsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`알림`)
};

/**
* | output |
* | --- |
* | "Notifications" |
*
* @param {Alerts_NotificationsInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const alerts_notifications = /** @type {((inputs?: Alerts_NotificationsInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_NotificationsInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_notifications(inputs)
	if (locale === "es") return es_alerts_notifications(inputs)
	if (locale === "de") return de_alerts_notifications(inputs)
	if (locale === "ar") return ar_alerts_notifications(inputs)
	if (locale === "fr") return fr_alerts_notifications(inputs)
	return ko_alerts_notifications(inputs)
});
export { alerts_notifications as "alerts.notifications" }