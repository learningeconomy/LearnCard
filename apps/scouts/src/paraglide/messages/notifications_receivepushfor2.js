/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Notifications_Receivepushfor2Inputs */

const en_notifications_receivepushfor2 = /** @type {(inputs: Notifications_Receivepushfor2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Receive push notifications for:`)
};

const es_notifications_receivepushfor2 = /** @type {(inputs: Notifications_Receivepushfor2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recibir notificaciones push para:`)
};

const fr_notifications_receivepushfor2 = /** @type {(inputs: Notifications_Receivepushfor2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recevoir des notifications push pour :`)
};

const ar_notifications_receivepushfor2 = /** @type {(inputs: Notifications_Receivepushfor2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Receive push notifications for:`)
};

/**
* | output |
* | --- |
* | "Receive push notifications for:" |
*
* @param {Notifications_Receivepushfor2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const notifications_receivepushfor2 = /** @type {((inputs?: Notifications_Receivepushfor2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_Receivepushfor2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_notifications_receivepushfor2(inputs)
	if (locale === "es") return es_notifications_receivepushfor2(inputs)
	if (locale === "fr") return fr_notifications_receivepushfor2(inputs)
	return ar_notifications_receivepushfor2(inputs)
});
export { notifications_receivepushfor2 as "notifications.receivePushFor" }