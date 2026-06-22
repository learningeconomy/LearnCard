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

const fr_alerts_notifications = /** @type {(inputs: Alerts_NotificationsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Notifications`)
};

const ar_alerts_notifications = /** @type {(inputs: Alerts_NotificationsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الإشعارات`)
};

/**
* | output |
* | --- |
* | "Notifications" |
*
* @param {Alerts_NotificationsInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const alerts_notifications = /** @type {((inputs?: Alerts_NotificationsInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_NotificationsInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_notifications(inputs)
	if (locale === "es") return es_alerts_notifications(inputs)
	if (locale === "fr") return fr_alerts_notifications(inputs)
	return ar_alerts_notifications(inputs)
});
export { alerts_notifications as "alerts.notifications" }