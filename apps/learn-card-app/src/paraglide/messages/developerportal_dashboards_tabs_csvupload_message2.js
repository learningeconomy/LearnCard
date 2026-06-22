/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Csvupload_Message2Inputs */

const en_developerportal_dashboards_tabs_csvupload_message2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Message2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Message`)
};

const es_developerportal_dashboards_tabs_csvupload_message2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Message2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mensaje`)
};

const fr_developerportal_dashboards_tabs_csvupload_message2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Message2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Message`)
};

const ar_developerportal_dashboards_tabs_csvupload_message2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Message2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رسالة`)
};

/**
* | output |
* | --- |
* | "Message" |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Message2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_message2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Csvupload_Message2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Message2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_message2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_message2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_message2(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_message2(inputs)
});
export { developerportal_dashboards_tabs_csvupload_message2 as "developerPortal.dashboards.tabs.csvUpload.message" }