/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Notifications_ClaimedInputs */

const en_notifications_claimed = /** @type {(inputs: Notifications_ClaimedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Claimed`)
};

const es_notifications_claimed = /** @type {(inputs: Notifications_ClaimedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reclamado`)
};

const fr_notifications_claimed = /** @type {(inputs: Notifications_ClaimedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réclamé`)
};

const ar_notifications_claimed = /** @type {(inputs: Notifications_ClaimedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Claimed`)
};

/**
* | output |
* | --- |
* | "Claimed" |
*
* @param {Notifications_ClaimedInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const notifications_claimed = /** @type {((inputs?: Notifications_ClaimedInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_ClaimedInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_notifications_claimed(inputs)
	if (locale === "es") return es_notifications_claimed(inputs)
	if (locale === "fr") return fr_notifications_claimed(inputs)
	return ar_notifications_claimed(inputs)
});
export { notifications_claimed as "notifications.claimed" }