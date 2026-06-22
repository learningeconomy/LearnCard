/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Export_Exportcsv2Inputs */

const en_developerportal_dashboards_export_exportcsv2 = /** @type {(inputs: Developerportal_Dashboards_Export_Exportcsv2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Export CSV`)
};

const es_developerportal_dashboards_export_exportcsv2 = /** @type {(inputs: Developerportal_Dashboards_Export_Exportcsv2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Exportar CSV`)
};

const fr_developerportal_dashboards_export_exportcsv2 = /** @type {(inputs: Developerportal_Dashboards_Export_Exportcsv2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Exporter CSV`)
};

const ar_developerportal_dashboards_export_exportcsv2 = /** @type {(inputs: Developerportal_Dashboards_Export_Exportcsv2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تصدير CSV`)
};

/**
* | output |
* | --- |
* | "Export CSV" |
*
* @param {Developerportal_Dashboards_Export_Exportcsv2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_export_exportcsv2 = /** @type {((inputs?: Developerportal_Dashboards_Export_Exportcsv2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Export_Exportcsv2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_export_exportcsv2(inputs)
	if (locale === "es") return es_developerportal_dashboards_export_exportcsv2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_export_exportcsv2(inputs)
	return ar_developerportal_dashboards_export_exportcsv2(inputs)
});
export { developerportal_dashboards_export_exportcsv2 as "developerPortal.dashboards.export.exportCsv" }