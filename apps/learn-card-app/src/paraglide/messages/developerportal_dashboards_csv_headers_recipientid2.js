/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Csv_Headers_Recipientid2Inputs */

const en_developerportal_dashboards_csv_headers_recipientid2 = /** @type {(inputs: Developerportal_Dashboards_Csv_Headers_Recipientid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recipient ID`)
};

const es_developerportal_dashboards_csv_headers_recipientid2 = /** @type {(inputs: Developerportal_Dashboards_Csv_Headers_Recipientid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID del Destinatario`)
};

const fr_developerportal_dashboards_csv_headers_recipientid2 = /** @type {(inputs: Developerportal_Dashboards_Csv_Headers_Recipientid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID du Destinataire`)
};

const ar_developerportal_dashboards_csv_headers_recipientid2 = /** @type {(inputs: Developerportal_Dashboards_Csv_Headers_Recipientid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معرف المستلم`)
};

/**
* | output |
* | --- |
* | "Recipient ID" |
*
* @param {Developerportal_Dashboards_Csv_Headers_Recipientid2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_csv_headers_recipientid2 = /** @type {((inputs?: Developerportal_Dashboards_Csv_Headers_Recipientid2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Csv_Headers_Recipientid2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_csv_headers_recipientid2(inputs)
	if (locale === "es") return es_developerportal_dashboards_csv_headers_recipientid2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_csv_headers_recipientid2(inputs)
	return ar_developerportal_dashboards_csv_headers_recipientid2(inputs)
});
export { developerportal_dashboards_csv_headers_recipientid2 as "developerPortal.dashboards.csv.headers.recipientId" }