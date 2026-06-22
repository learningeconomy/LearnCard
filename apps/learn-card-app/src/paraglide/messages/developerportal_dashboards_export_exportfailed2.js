/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Export_Exportfailed2Inputs */

const en_developerportal_dashboards_export_exportfailed2 = /** @type {(inputs: Developerportal_Dashboards_Export_Exportfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Export failed`)
};

const es_developerportal_dashboards_export_exportfailed2 = /** @type {(inputs: Developerportal_Dashboards_Export_Exportfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al exportar`)
};

const fr_developerportal_dashboards_export_exportfailed2 = /** @type {(inputs: Developerportal_Dashboards_Export_Exportfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de l'exportation`)
};

const ar_developerportal_dashboards_export_exportfailed2 = /** @type {(inputs: Developerportal_Dashboards_Export_Exportfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل التصدير`)
};

/**
* | output |
* | --- |
* | "Export failed" |
*
* @param {Developerportal_Dashboards_Export_Exportfailed2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_export_exportfailed2 = /** @type {((inputs?: Developerportal_Dashboards_Export_Exportfailed2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Export_Exportfailed2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_export_exportfailed2(inputs)
	if (locale === "es") return es_developerportal_dashboards_export_exportfailed2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_export_exportfailed2(inputs)
	return ar_developerportal_dashboards_export_exportfailed2(inputs)
});
export { developerportal_dashboards_export_exportfailed2 as "developerPortal.dashboards.export.exportFailed" }