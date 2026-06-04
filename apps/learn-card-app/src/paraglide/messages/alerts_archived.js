/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Alerts_ArchivedInputs */

const en_alerts_archived = /** @type {(inputs: Alerts_ArchivedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archived`)
};

const es_alerts_archived = /** @type {(inputs: Alerts_ArchivedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archivadas`)
};

const de_alerts_archived = /** @type {(inputs: Alerts_ArchivedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archiviert`)
};

const ar_alerts_archived = /** @type {(inputs: Alerts_ArchivedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مؤرشفة`)
};

const fr_alerts_archived = /** @type {(inputs: Alerts_ArchivedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archivées`)
};

const ko_alerts_archived = /** @type {(inputs: Alerts_ArchivedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`보관됨`)
};

/**
* | output |
* | --- |
* | "Archived" |
*
* @param {Alerts_ArchivedInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const alerts_archived = /** @type {((inputs?: Alerts_ArchivedInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_ArchivedInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_archived(inputs)
	if (locale === "es") return es_alerts_archived(inputs)
	if (locale === "de") return de_alerts_archived(inputs)
	if (locale === "ar") return ar_alerts_archived(inputs)
	if (locale === "fr") return fr_alerts_archived(inputs)
	return ko_alerts_archived(inputs)
});
export { alerts_archived as "alerts.archived" }