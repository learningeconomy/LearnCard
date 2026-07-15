/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Notifications_Archiveall1Inputs */

const en_notifications_archiveall1 = /** @type {(inputs: Notifications_Archiveall1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archive All`)
};

const es_notifications_archiveall1 = /** @type {(inputs: Notifications_Archiveall1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archivar Todo`)
};

const fr_notifications_archiveall1 = /** @type {(inputs: Notifications_Archiveall1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tout archiver`)
};

const ar_notifications_archiveall1 = /** @type {(inputs: Notifications_Archiveall1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أرشفة الكل`)
};

/**
* | output |
* | --- |
* | "Archive All" |
*
* @param {Notifications_Archiveall1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const notifications_archiveall1 = /** @type {((inputs?: Notifications_Archiveall1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_Archiveall1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_notifications_archiveall1(inputs)
	if (locale === "es") return es_notifications_archiveall1(inputs)
	if (locale === "fr") return fr_notifications_archiveall1(inputs)
	return ar_notifications_archiveall1(inputs)
});
export { notifications_archiveall1 as "notifications.archiveAll" }