/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Notifications_AcceptedInputs */

const en_notifications_accepted = /** @type {(inputs: Notifications_AcceptedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accepted`)
};

const es_notifications_accepted = /** @type {(inputs: Notifications_AcceptedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aceptado`)
};

const fr_notifications_accepted = /** @type {(inputs: Notifications_AcceptedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accepté`)
};

const ar_notifications_accepted = /** @type {(inputs: Notifications_AcceptedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مقبول`)
};

/**
* | output |
* | --- |
* | "Accepted" |
*
* @param {Notifications_AcceptedInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const notifications_accepted = /** @type {((inputs?: Notifications_AcceptedInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_AcceptedInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_notifications_accepted(inputs)
	if (locale === "es") return es_notifications_accepted(inputs)
	if (locale === "fr") return fr_notifications_accepted(inputs)
	return ar_notifications_accepted(inputs)
});
export { notifications_accepted as "notifications.accepted" }