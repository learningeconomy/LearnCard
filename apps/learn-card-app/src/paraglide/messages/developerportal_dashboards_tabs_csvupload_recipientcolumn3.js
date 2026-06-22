/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Csvupload_Recipientcolumn3Inputs */

const en_developerportal_dashboards_tabs_csvupload_recipientcolumn3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Recipientcolumn3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recipient Column`)
};

const es_developerportal_dashboards_tabs_csvupload_recipientcolumn3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Recipientcolumn3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Columna de Destinatario`)
};

const fr_developerportal_dashboards_tabs_csvupload_recipientcolumn3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Recipientcolumn3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Colonne Destinataire`)
};

const ar_developerportal_dashboards_tabs_csvupload_recipientcolumn3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Recipientcolumn3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عمود المستلم`)
};

/**
* | output |
* | --- |
* | "Recipient Column" |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Recipientcolumn3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_recipientcolumn3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Csvupload_Recipientcolumn3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Recipientcolumn3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_recipientcolumn3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_recipientcolumn3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_recipientcolumn3(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_recipientcolumn3(inputs)
});
export { developerportal_dashboards_tabs_csvupload_recipientcolumn3 as "developerPortal.dashboards.tabs.csvUpload.recipientColumn" }