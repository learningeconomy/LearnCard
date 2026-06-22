/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Csv_Headers_Source1Inputs */

const en_developerportal_dashboards_csv_headers_source1 = /** @type {(inputs: Developerportal_Dashboards_Csv_Headers_Source1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Source`)
};

const es_developerportal_dashboards_csv_headers_source1 = /** @type {(inputs: Developerportal_Dashboards_Csv_Headers_Source1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Origen`)
};

const fr_developerportal_dashboards_csv_headers_source1 = /** @type {(inputs: Developerportal_Dashboards_Csv_Headers_Source1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Source`)
};

const ar_developerportal_dashboards_csv_headers_source1 = /** @type {(inputs: Developerportal_Dashboards_Csv_Headers_Source1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المصدر`)
};

/**
* | output |
* | --- |
* | "Source" |
*
* @param {Developerportal_Dashboards_Csv_Headers_Source1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_csv_headers_source1 = /** @type {((inputs?: Developerportal_Dashboards_Csv_Headers_Source1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Csv_Headers_Source1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_csv_headers_source1(inputs)
	if (locale === "es") return es_developerportal_dashboards_csv_headers_source1(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_csv_headers_source1(inputs)
	return ar_developerportal_dashboards_csv_headers_source1(inputs)
});
export { developerportal_dashboards_csv_headers_source1 as "developerPortal.dashboards.csv.headers.source" }