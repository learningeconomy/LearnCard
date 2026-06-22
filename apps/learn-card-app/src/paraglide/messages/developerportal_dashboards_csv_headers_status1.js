/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Csv_Headers_Status1Inputs */

const en_developerportal_dashboards_csv_headers_status1 = /** @type {(inputs: Developerportal_Dashboards_Csv_Headers_Status1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Status`)
};

const es_developerportal_dashboards_csv_headers_status1 = /** @type {(inputs: Developerportal_Dashboards_Csv_Headers_Status1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Estado`)
};

const fr_developerportal_dashboards_csv_headers_status1 = /** @type {(inputs: Developerportal_Dashboards_Csv_Headers_Status1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Statut`)
};

const ar_developerportal_dashboards_csv_headers_status1 = /** @type {(inputs: Developerportal_Dashboards_Csv_Headers_Status1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الحالة`)
};

/**
* | output |
* | --- |
* | "Status" |
*
* @param {Developerportal_Dashboards_Csv_Headers_Status1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_csv_headers_status1 = /** @type {((inputs?: Developerportal_Dashboards_Csv_Headers_Status1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Csv_Headers_Status1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_csv_headers_status1(inputs)
	if (locale === "es") return es_developerportal_dashboards_csv_headers_status1(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_csv_headers_status1(inputs)
	return ar_developerportal_dashboards_csv_headers_status1(inputs)
});
export { developerportal_dashboards_csv_headers_status1 as "developerPortal.dashboards.csv.headers.status" }