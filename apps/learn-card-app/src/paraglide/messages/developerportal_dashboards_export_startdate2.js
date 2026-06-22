/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Export_Startdate2Inputs */

const en_developerportal_dashboards_export_startdate2 = /** @type {(inputs: Developerportal_Dashboards_Export_Startdate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Start Date`)
};

const es_developerportal_dashboards_export_startdate2 = /** @type {(inputs: Developerportal_Dashboards_Export_Startdate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fecha de Inicio`)
};

const fr_developerportal_dashboards_export_startdate2 = /** @type {(inputs: Developerportal_Dashboards_Export_Startdate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Date de Début`)
};

const ar_developerportal_dashboards_export_startdate2 = /** @type {(inputs: Developerportal_Dashboards_Export_Startdate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تاريخ البداية`)
};

/**
* | output |
* | --- |
* | "Start Date" |
*
* @param {Developerportal_Dashboards_Export_Startdate2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_export_startdate2 = /** @type {((inputs?: Developerportal_Dashboards_Export_Startdate2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Export_Startdate2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_export_startdate2(inputs)
	if (locale === "es") return es_developerportal_dashboards_export_startdate2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_export_startdate2(inputs)
	return ar_developerportal_dashboards_export_startdate2(inputs)
});
export { developerportal_dashboards_export_startdate2 as "developerPortal.dashboards.export.startDate" }