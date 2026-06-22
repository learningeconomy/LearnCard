/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Export_Title1Inputs */

const en_developerportal_dashboards_export_title1 = /** @type {(inputs: Developerportal_Dashboards_Export_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Download CSV`)
};

const es_developerportal_dashboards_export_title1 = /** @type {(inputs: Developerportal_Dashboards_Export_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Descargar CSV`)
};

const fr_developerportal_dashboards_export_title1 = /** @type {(inputs: Developerportal_Dashboards_Export_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Télécharger CSV`)
};

const ar_developerportal_dashboards_export_title1 = /** @type {(inputs: Developerportal_Dashboards_Export_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تنزيل CSV`)
};

/**
* | output |
* | --- |
* | "Download CSV" |
*
* @param {Developerportal_Dashboards_Export_Title1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_export_title1 = /** @type {((inputs?: Developerportal_Dashboards_Export_Title1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Export_Title1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_export_title1(inputs)
	if (locale === "es") return es_developerportal_dashboards_export_title1(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_export_title1(inputs)
	return ar_developerportal_dashboards_export_title1(inputs)
});
export { developerportal_dashboards_export_title1 as "developerPortal.dashboards.export.title" }