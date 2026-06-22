/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Csvupload_Recipientcolumnlabel4Inputs */

const en_developerportal_dashboards_tabs_csvupload_recipientcolumnlabel4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Recipientcolumnlabel4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`recipient *`)
};

const es_developerportal_dashboards_tabs_csvupload_recipientcolumnlabel4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Recipientcolumnlabel4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`destinatario *`)
};

const fr_developerportal_dashboards_tabs_csvupload_recipientcolumnlabel4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Recipientcolumnlabel4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`destinataire *`)
};

const ar_developerportal_dashboards_tabs_csvupload_recipientcolumnlabel4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Recipientcolumnlabel4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المستلم *`)
};

/**
* | output |
* | --- |
* | "recipient *" |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Recipientcolumnlabel4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_recipientcolumnlabel4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Csvupload_Recipientcolumnlabel4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Recipientcolumnlabel4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_recipientcolumnlabel4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_recipientcolumnlabel4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_recipientcolumnlabel4(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_recipientcolumnlabel4(inputs)
});
export { developerportal_dashboards_tabs_csvupload_recipientcolumnlabel4 as "developerPortal.dashboards.tabs.csvUpload.recipientColumnLabel" }