/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Export_Daterange2Inputs */

const en_developerportal_dashboards_export_daterange2 = /** @type {(inputs: Developerportal_Dashboards_Export_Daterange2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Date Range (Optional)`)
};

const es_developerportal_dashboards_export_daterange2 = /** @type {(inputs: Developerportal_Dashboards_Export_Daterange2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rango de Fechas (Opcional)`)
};

const fr_developerportal_dashboards_export_daterange2 = /** @type {(inputs: Developerportal_Dashboards_Export_Daterange2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Période (Optionnelle)`)
};

const ar_developerportal_dashboards_export_daterange2 = /** @type {(inputs: Developerportal_Dashboards_Export_Daterange2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نطاق التاريخ (اختياري)`)
};

/**
* | output |
* | --- |
* | "Date Range (Optional)" |
*
* @param {Developerportal_Dashboards_Export_Daterange2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_export_daterange2 = /** @type {((inputs?: Developerportal_Dashboards_Export_Daterange2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Export_Daterange2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_export_daterange2(inputs)
	if (locale === "es") return es_developerportal_dashboards_export_daterange2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_export_daterange2(inputs)
	return ar_developerportal_dashboards_export_daterange2(inputs)
});
export { developerportal_dashboards_export_daterange2 as "developerPortal.dashboards.export.dateRange" }