/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Csv_Headers_Recipienttype2Inputs */

const en_developerportal_dashboards_csv_headers_recipienttype2 = /** @type {(inputs: Developerportal_Dashboards_Csv_Headers_Recipienttype2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recipient Type`)
};

const es_developerportal_dashboards_csv_headers_recipienttype2 = /** @type {(inputs: Developerportal_Dashboards_Csv_Headers_Recipienttype2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tipo de Destinatario`)
};

const fr_developerportal_dashboards_csv_headers_recipienttype2 = /** @type {(inputs: Developerportal_Dashboards_Csv_Headers_Recipienttype2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Type de Destinataire`)
};

const ar_developerportal_dashboards_csv_headers_recipienttype2 = /** @type {(inputs: Developerportal_Dashboards_Csv_Headers_Recipienttype2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نوع المستلم`)
};

/**
* | output |
* | --- |
* | "Recipient Type" |
*
* @param {Developerportal_Dashboards_Csv_Headers_Recipienttype2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_csv_headers_recipienttype2 = /** @type {((inputs?: Developerportal_Dashboards_Csv_Headers_Recipienttype2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Csv_Headers_Recipienttype2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_csv_headers_recipienttype2(inputs)
	if (locale === "es") return es_developerportal_dashboards_csv_headers_recipienttype2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_csv_headers_recipienttype2(inputs)
	return ar_developerportal_dashboards_csv_headers_recipienttype2(inputs)
});
export { developerportal_dashboards_csv_headers_recipienttype2 as "developerPortal.dashboards.csv.headers.recipientType" }