/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Notifications_AlertsInputs */

const en_notifications_alerts = /** @type {(inputs: Notifications_AlertsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alerts`)
};

const es_notifications_alerts = /** @type {(inputs: Notifications_AlertsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alertas`)
};

const fr_notifications_alerts = /** @type {(inputs: Notifications_AlertsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alertes`)
};

const ar_notifications_alerts = /** @type {(inputs: Notifications_AlertsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alerts`)
};

/**
* | output |
* | --- |
* | "Alerts" |
*
* @param {Notifications_AlertsInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const notifications_alerts = /** @type {((inputs?: Notifications_AlertsInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_AlertsInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_notifications_alerts(inputs)
	if (locale === "es") return es_notifications_alerts(inputs)
	if (locale === "fr") return fr_notifications_alerts(inputs)
	return ar_notifications_alerts(inputs)
});
export { notifications_alerts as "notifications.alerts" }