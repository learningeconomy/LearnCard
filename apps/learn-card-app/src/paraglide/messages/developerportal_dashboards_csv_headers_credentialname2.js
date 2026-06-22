/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Csv_Headers_Credentialname2Inputs */

const en_developerportal_dashboards_csv_headers_credentialname2 = /** @type {(inputs: Developerportal_Dashboards_Csv_Headers_Credentialname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential Name`)
};

const es_developerportal_dashboards_csv_headers_credentialname2 = /** @type {(inputs: Developerportal_Dashboards_Csv_Headers_Credentialname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre de Credencial`)
};

const fr_developerportal_dashboards_csv_headers_credentialname2 = /** @type {(inputs: Developerportal_Dashboards_Csv_Headers_Credentialname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom du Certificat`)
};

const ar_developerportal_dashboards_csv_headers_credentialname2 = /** @type {(inputs: Developerportal_Dashboards_Csv_Headers_Credentialname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم الشهادة`)
};

/**
* | output |
* | --- |
* | "Credential Name" |
*
* @param {Developerportal_Dashboards_Csv_Headers_Credentialname2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_csv_headers_credentialname2 = /** @type {((inputs?: Developerportal_Dashboards_Csv_Headers_Credentialname2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Csv_Headers_Credentialname2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_csv_headers_credentialname2(inputs)
	if (locale === "es") return es_developerportal_dashboards_csv_headers_credentialname2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_csv_headers_credentialname2(inputs)
	return ar_developerportal_dashboards_csv_headers_credentialname2(inputs)
});
export { developerportal_dashboards_csv_headers_credentialname2 as "developerPortal.dashboards.csv.headers.credentialName" }