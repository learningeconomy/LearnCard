/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Csv_Headers_Deliverymethod2Inputs */

const en_developerportal_dashboards_csv_headers_deliverymethod2 = /** @type {(inputs: Developerportal_Dashboards_Csv_Headers_Deliverymethod2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Delivery Method`)
};

const es_developerportal_dashboards_csv_headers_deliverymethod2 = /** @type {(inputs: Developerportal_Dashboards_Csv_Headers_Deliverymethod2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Método de Entrega`)
};

const fr_developerportal_dashboards_csv_headers_deliverymethod2 = /** @type {(inputs: Developerportal_Dashboards_Csv_Headers_Deliverymethod2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mode de Livraison`)
};

const ar_developerportal_dashboards_csv_headers_deliverymethod2 = /** @type {(inputs: Developerportal_Dashboards_Csv_Headers_Deliverymethod2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طريقة التسليم`)
};

/**
* | output |
* | --- |
* | "Delivery Method" |
*
* @param {Developerportal_Dashboards_Csv_Headers_Deliverymethod2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_csv_headers_deliverymethod2 = /** @type {((inputs?: Developerportal_Dashboards_Csv_Headers_Deliverymethod2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Csv_Headers_Deliverymethod2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_csv_headers_deliverymethod2(inputs)
	if (locale === "es") return es_developerportal_dashboards_csv_headers_deliverymethod2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_csv_headers_deliverymethod2(inputs)
	return ar_developerportal_dashboards_csv_headers_deliverymethod2(inputs)
});
export { developerportal_dashboards_csv_headers_deliverymethod2 as "developerPortal.dashboards.csv.headers.deliveryMethod" }