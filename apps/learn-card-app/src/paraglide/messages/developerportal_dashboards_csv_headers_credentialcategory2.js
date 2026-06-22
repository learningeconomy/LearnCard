/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Csv_Headers_Credentialcategory2Inputs */

const en_developerportal_dashboards_csv_headers_credentialcategory2 = /** @type {(inputs: Developerportal_Dashboards_Csv_Headers_Credentialcategory2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential Category`)
};

const es_developerportal_dashboards_csv_headers_credentialcategory2 = /** @type {(inputs: Developerportal_Dashboards_Csv_Headers_Credentialcategory2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Categoría de Credencial`)
};

const fr_developerportal_dashboards_csv_headers_credentialcategory2 = /** @type {(inputs: Developerportal_Dashboards_Csv_Headers_Credentialcategory2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Catégorie du Certificat`)
};

const ar_developerportal_dashboards_csv_headers_credentialcategory2 = /** @type {(inputs: Developerportal_Dashboards_Csv_Headers_Credentialcategory2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فئة الشهادة`)
};

/**
* | output |
* | --- |
* | "Credential Category" |
*
* @param {Developerportal_Dashboards_Csv_Headers_Credentialcategory2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_csv_headers_credentialcategory2 = /** @type {((inputs?: Developerportal_Dashboards_Csv_Headers_Credentialcategory2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Csv_Headers_Credentialcategory2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_csv_headers_credentialcategory2(inputs)
	if (locale === "es") return es_developerportal_dashboards_csv_headers_credentialcategory2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_csv_headers_credentialcategory2(inputs)
	return ar_developerportal_dashboards_csv_headers_credentialcategory2(inputs)
});
export { developerportal_dashboards_csv_headers_credentialcategory2 as "developerPortal.dashboards.csv.headers.credentialCategory" }