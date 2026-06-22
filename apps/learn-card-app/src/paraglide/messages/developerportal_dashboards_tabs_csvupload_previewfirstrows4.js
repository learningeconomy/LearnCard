/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Dashboards_Tabs_Csvupload_Previewfirstrows4Inputs */

const en_developerportal_dashboards_tabs_csvupload_previewfirstrows4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Previewfirstrows4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Preview (first ${i?.count} rows)`)
};

const es_developerportal_dashboards_tabs_csvupload_previewfirstrows4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Previewfirstrows4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Vista previa (primeras ${i?.count} filas)`)
};

const fr_developerportal_dashboards_tabs_csvupload_previewfirstrows4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Previewfirstrows4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Aperçu (premières ${i?.count} lignes)`)
};

const ar_developerportal_dashboards_tabs_csvupload_previewfirstrows4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Previewfirstrows4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`معاينة (أول ${i?.count} صفوف)`)
};

/**
* | output |
* | --- |
* | "Preview (first {count} rows)" |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Previewfirstrows4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_previewfirstrows4 = /** @type {((inputs: Developerportal_Dashboards_Tabs_Csvupload_Previewfirstrows4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Previewfirstrows4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_previewfirstrows4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_previewfirstrows4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_previewfirstrows4(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_previewfirstrows4(inputs)
});
export { developerportal_dashboards_tabs_csvupload_previewfirstrows4 as "developerPortal.dashboards.tabs.csvUpload.previewFirstRows" }