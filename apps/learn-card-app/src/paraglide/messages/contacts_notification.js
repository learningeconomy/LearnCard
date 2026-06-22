/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_NotificationInputs */

const en_contacts_notification = /** @type {(inputs: Contacts_NotificationInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Notification`)
};

const es_contacts_notification = /** @type {(inputs: Contacts_NotificationInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Notificación`)
};

const fr_contacts_notification = /** @type {(inputs: Contacts_NotificationInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Notification`)
};

const ar_contacts_notification = /** @type {(inputs: Contacts_NotificationInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إشعار`)
};

/**
* | output |
* | --- |
* | "Notification" |
*
* @param {Contacts_NotificationInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_notification = /** @type {((inputs?: Contacts_NotificationInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_NotificationInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_notification(inputs)
	if (locale === "es") return es_contacts_notification(inputs)
	if (locale === "fr") return fr_contacts_notification(inputs)
	return ar_contacts_notification(inputs)
});
export { contacts_notification as "contacts.notification" }