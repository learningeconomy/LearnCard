/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Export_Downloading1Inputs */

const en_developerportal_dashboards_export_downloading1 = /** @type {(inputs: Developerportal_Dashboards_Export_Downloading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Downloading...`)
};

const es_developerportal_dashboards_export_downloading1 = /** @type {(inputs: Developerportal_Dashboards_Export_Downloading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Descargando...`)
};

const fr_developerportal_dashboards_export_downloading1 = /** @type {(inputs: Developerportal_Dashboards_Export_Downloading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Téléchargement...`)
};

const ar_developerportal_dashboards_export_downloading1 = /** @type {(inputs: Developerportal_Dashboards_Export_Downloading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ التنزيل...`)
};

/**
* | output |
* | --- |
* | "Downloading..." |
*
* @param {Developerportal_Dashboards_Export_Downloading1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_export_downloading1 = /** @type {((inputs?: Developerportal_Dashboards_Export_Downloading1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Export_Downloading1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_export_downloading1(inputs)
	if (locale === "es") return es_developerportal_dashboards_export_downloading1(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_export_downloading1(inputs)
	return ar_developerportal_dashboards_export_downloading1(inputs)
});
export { developerportal_dashboards_export_downloading1 as "developerPortal.dashboards.export.downloading" }