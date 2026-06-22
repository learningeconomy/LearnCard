/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Csv_Headers_Recipientname2Inputs */

const en_developerportal_dashboards_csv_headers_recipientname2 = /** @type {(inputs: Developerportal_Dashboards_Csv_Headers_Recipientname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recipient Name`)
};

const es_developerportal_dashboards_csv_headers_recipientname2 = /** @type {(inputs: Developerportal_Dashboards_Csv_Headers_Recipientname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre del Destinatario`)
};

const fr_developerportal_dashboards_csv_headers_recipientname2 = /** @type {(inputs: Developerportal_Dashboards_Csv_Headers_Recipientname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom du Destinataire`)
};

const ar_developerportal_dashboards_csv_headers_recipientname2 = /** @type {(inputs: Developerportal_Dashboards_Csv_Headers_Recipientname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم المستلم`)
};

/**
* | output |
* | --- |
* | "Recipient Name" |
*
* @param {Developerportal_Dashboards_Csv_Headers_Recipientname2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_csv_headers_recipientname2 = /** @type {((inputs?: Developerportal_Dashboards_Csv_Headers_Recipientname2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Csv_Headers_Recipientname2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_csv_headers_recipientname2(inputs)
	if (locale === "es") return es_developerportal_dashboards_csv_headers_recipientname2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_csv_headers_recipientname2(inputs)
	return ar_developerportal_dashboards_csv_headers_recipientname2(inputs)
});
export { developerportal_dashboards_csv_headers_recipientname2 as "developerPortal.dashboards.csv.headers.recipientName" }