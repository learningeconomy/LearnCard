/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Notifications_Archivedwithcount2Inputs */

const en_notifications_archivedwithcount2 = /** @type {(inputs: Notifications_Archivedwithcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} Archived`)
};

const es_notifications_archivedwithcount2 = /** @type {(inputs: Notifications_Archivedwithcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} Archivados`)
};

const fr_notifications_archivedwithcount2 = /** @type {(inputs: Notifications_Archivedwithcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} archivé`)
};

const ar_notifications_archivedwithcount2 = /** @type {(inputs: Notifications_Archivedwithcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} مؤرشف`)
};

/**
* | output |
* | --- |
* | "{count} Archived" |
*
* @param {Notifications_Archivedwithcount2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const notifications_archivedwithcount2 = /** @type {((inputs: Notifications_Archivedwithcount2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_Archivedwithcount2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_notifications_archivedwithcount2(inputs)
	if (locale === "es") return es_notifications_archivedwithcount2(inputs)
	if (locale === "fr") return fr_notifications_archivedwithcount2(inputs)
	return ar_notifications_archivedwithcount2(inputs)
});
export { notifications_archivedwithcount2 as "notifications.archivedWithCount" }