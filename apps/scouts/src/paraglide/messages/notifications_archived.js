/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Notifications_ArchivedInputs */

const en_notifications_archived = /** @type {(inputs: Notifications_ArchivedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archived`)
};

const es_notifications_archived = /** @type {(inputs: Notifications_ArchivedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archivado`)
};

const fr_notifications_archived = /** @type {(inputs: Notifications_ArchivedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archivé`)
};

const ar_notifications_archived = /** @type {(inputs: Notifications_ArchivedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archived`)
};

/**
* | output |
* | --- |
* | "Archived" |
*
* @param {Notifications_ArchivedInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const notifications_archived = /** @type {((inputs?: Notifications_ArchivedInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_ArchivedInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_notifications_archived(inputs)
	if (locale === "es") return es_notifications_archived(inputs)
	if (locale === "fr") return fr_notifications_archived(inputs)
	return ar_notifications_archived(inputs)
});
export { notifications_archived as "notifications.archived" }