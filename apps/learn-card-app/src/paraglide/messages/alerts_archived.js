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

const fr_alerts_archived = /** @type {(inputs: Alerts_ArchivedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archivées`)
};

const ar_alerts_archived = /** @type {(inputs: Alerts_ArchivedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مؤرشفة`)
};

/**
* | output |
* | --- |
* | "Archived" |
*
* @param {Alerts_ArchivedInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const alerts_archived = /** @type {((inputs?: Alerts_ArchivedInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_ArchivedInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_archived(inputs)
	if (locale === "es") return es_alerts_archived(inputs)
	if (locale === "fr") return fr_alerts_archived(inputs)
	return ar_alerts_archived(inputs)
});
export { alerts_archived as "alerts.archived" }