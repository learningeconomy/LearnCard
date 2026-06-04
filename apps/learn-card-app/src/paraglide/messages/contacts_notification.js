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

const de_contacts_notification = /** @type {(inputs: Contacts_NotificationInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Benachrichtigung`)
};

const ar_contacts_notification = /** @type {(inputs: Contacts_NotificationInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إشعار`)
};

const fr_contacts_notification = /** @type {(inputs: Contacts_NotificationInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Notification`)
};

const ko_contacts_notification = /** @type {(inputs: Contacts_NotificationInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`알림`)
};

/**
* | output |
* | --- |
* | "Notification" |
*
* @param {Contacts_NotificationInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_notification = /** @type {((inputs?: Contacts_NotificationInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_NotificationInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_notification(inputs)
	if (locale === "es") return es_contacts_notification(inputs)
	if (locale === "de") return de_contacts_notification(inputs)
	if (locale === "ar") return ar_contacts_notification(inputs)
	if (locale === "fr") return fr_contacts_notification(inputs)
	return ko_contacts_notification(inputs)
});
export { contacts_notification as "contacts.notification" }