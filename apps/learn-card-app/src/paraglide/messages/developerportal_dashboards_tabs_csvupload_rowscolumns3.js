/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ rows: NonNullable<unknown>, columns: NonNullable<unknown> }} Developerportal_Dashboards_Tabs_Csvupload_Rowscolumns3Inputs */

const en_developerportal_dashboards_tabs_csvupload_rowscolumns3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Rowscolumns3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.rows} rows, ${i?.columns} columns`)
};

const es_developerportal_dashboards_tabs_csvupload_rowscolumns3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Rowscolumns3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.rows} filas, ${i?.columns} columnas`)
};

const fr_developerportal_dashboards_tabs_csvupload_rowscolumns3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Rowscolumns3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.rows} lignes, ${i?.columns} colonnes`)
};

const ar_developerportal_dashboards_tabs_csvupload_rowscolumns3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Rowscolumns3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.rows} صف، ${i?.columns} عمود`)
};

/**
* | output |
* | --- |
* | "{rows} rows, {columns} columns" |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Rowscolumns3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_rowscolumns3 = /** @type {((inputs: Developerportal_Dashboards_Tabs_Csvupload_Rowscolumns3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Rowscolumns3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_rowscolumns3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_rowscolumns3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_rowscolumns3(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_rowscolumns3(inputs)
});
export { developerportal_dashboards_tabs_csvupload_rowscolumns3 as "developerPortal.dashboards.tabs.csvUpload.rowsColumns" }