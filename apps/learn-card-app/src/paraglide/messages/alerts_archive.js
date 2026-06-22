/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Alerts_ArchiveInputs */

const en_alerts_archive = /** @type {(inputs: Alerts_ArchiveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archive`)
};

const es_alerts_archive = /** @type {(inputs: Alerts_ArchiveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archivar`)
};

const fr_alerts_archive = /** @type {(inputs: Alerts_ArchiveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archiver`)
};

const ar_alerts_archive = /** @type {(inputs: Alerts_ArchiveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أرشفة`)
};

/**
* | output |
* | --- |
* | "Archive" |
*
* @param {Alerts_ArchiveInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const alerts_archive = /** @type {((inputs?: Alerts_ArchiveInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_ArchiveInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_archive(inputs)
	if (locale === "es") return es_alerts_archive(inputs)
	if (locale === "fr") return fr_alerts_archive(inputs)
	return ar_alerts_archive(inputs)
});
export { alerts_archive as "alerts.archive" }