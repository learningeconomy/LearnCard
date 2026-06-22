/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Csv_Headers_Timetoclaim3Inputs */

const en_developerportal_dashboards_csv_headers_timetoclaim3 = /** @type {(inputs: Developerportal_Dashboards_Csv_Headers_Timetoclaim3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Time to Claim (hours)`)
};

const es_developerportal_dashboards_csv_headers_timetoclaim3 = /** @type {(inputs: Developerportal_Dashboards_Csv_Headers_Timetoclaim3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tiempo para Reclamar (horas)`)
};

const fr_developerportal_dashboards_csv_headers_timetoclaim3 = /** @type {(inputs: Developerportal_Dashboards_Csv_Headers_Timetoclaim3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Délai de Réclamation (heures)`)
};

const ar_developerportal_dashboards_csv_headers_timetoclaim3 = /** @type {(inputs: Developerportal_Dashboards_Csv_Headers_Timetoclaim3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`وقت المطالبة (ساعات)`)
};

/**
* | output |
* | --- |
* | "Time to Claim (hours)" |
*
* @param {Developerportal_Dashboards_Csv_Headers_Timetoclaim3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_csv_headers_timetoclaim3 = /** @type {((inputs?: Developerportal_Dashboards_Csv_Headers_Timetoclaim3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Csv_Headers_Timetoclaim3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_csv_headers_timetoclaim3(inputs)
	if (locale === "es") return es_developerportal_dashboards_csv_headers_timetoclaim3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_csv_headers_timetoclaim3(inputs)
	return ar_developerportal_dashboards_csv_headers_timetoclaim3(inputs)
});
export { developerportal_dashboards_csv_headers_timetoclaim3 as "developerPortal.dashboards.csv.headers.timeToClaim" }