/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Export_Enddate2Inputs */

const en_developerportal_dashboards_export_enddate2 = /** @type {(inputs: Developerportal_Dashboards_Export_Enddate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`End Date`)
};

const es_developerportal_dashboards_export_enddate2 = /** @type {(inputs: Developerportal_Dashboards_Export_Enddate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fecha de Fin`)
};

const fr_developerportal_dashboards_export_enddate2 = /** @type {(inputs: Developerportal_Dashboards_Export_Enddate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Date de Fin`)
};

const ar_developerportal_dashboards_export_enddate2 = /** @type {(inputs: Developerportal_Dashboards_Export_Enddate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تاريخ النهاية`)
};

/**
* | output |
* | --- |
* | "End Date" |
*
* @param {Developerportal_Dashboards_Export_Enddate2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_export_enddate2 = /** @type {((inputs?: Developerportal_Dashboards_Export_Enddate2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Export_Enddate2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_export_enddate2(inputs)
	if (locale === "es") return es_developerportal_dashboards_export_enddate2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_export_enddate2(inputs)
	return ar_developerportal_dashboards_export_enddate2(inputs)
});
export { developerportal_dashboards_export_enddate2 as "developerPortal.dashboards.export.endDate" }