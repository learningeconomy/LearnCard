/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Csvupload_Errormissingrecipient4Inputs */

const en_developerportal_dashboards_tabs_csvupload_errormissingrecipient4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Errormissingrecipient4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Missing recipient`)
};

const es_developerportal_dashboards_tabs_csvupload_errormissingrecipient4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Errormissingrecipient4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Destinatario faltante`)
};

const fr_developerportal_dashboards_tabs_csvupload_errormissingrecipient4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Errormissingrecipient4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Destinataire manquant`)
};

const ar_developerportal_dashboards_tabs_csvupload_errormissingrecipient4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Errormissingrecipient4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المستلم مفقود`)
};

/**
* | output |
* | --- |
* | "Missing recipient" |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Errormissingrecipient4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_errormissingrecipient4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Csvupload_Errormissingrecipient4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Errormissingrecipient4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_errormissingrecipient4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_errormissingrecipient4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_errormissingrecipient4(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_errormissingrecipient4(inputs)
});
export { developerportal_dashboards_tabs_csvupload_errormissingrecipient4 as "developerPortal.dashboards.tabs.csvUpload.errorMissingRecipient" }