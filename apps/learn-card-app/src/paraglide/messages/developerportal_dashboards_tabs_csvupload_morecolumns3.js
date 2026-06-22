/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Dashboards_Tabs_Csvupload_Morecolumns3Inputs */

const en_developerportal_dashboards_tabs_csvupload_morecolumns3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Morecolumns3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`+${i?.count} more`)
};

const es_developerportal_dashboards_tabs_csvupload_morecolumns3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Morecolumns3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`+${i?.count} más`)
};

const fr_developerportal_dashboards_tabs_csvupload_morecolumns3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Morecolumns3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`+${i?.count} de plus`)
};

const ar_developerportal_dashboards_tabs_csvupload_morecolumns3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Morecolumns3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`+${i?.count} المزيد`)
};

/**
* | output |
* | --- |
* | "+{count} more" |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Morecolumns3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_morecolumns3 = /** @type {((inputs: Developerportal_Dashboards_Tabs_Csvupload_Morecolumns3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Morecolumns3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_morecolumns3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_morecolumns3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_morecolumns3(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_morecolumns3(inputs)
});
export { developerportal_dashboards_tabs_csvupload_morecolumns3 as "developerPortal.dashboards.tabs.csvUpload.moreColumns" }