/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Csvupload_Failedlabel3Inputs */

const en_developerportal_dashboards_tabs_csvupload_failedlabel3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Failedlabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`failed`)
};

const es_developerportal_dashboards_tabs_csvupload_failedlabel3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Failedlabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`falló`)
};

const fr_developerportal_dashboards_tabs_csvupload_failedlabel3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Failedlabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`échec`)
};

const ar_developerportal_dashboards_tabs_csvupload_failedlabel3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Failedlabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل`)
};

/**
* | output |
* | --- |
* | "failed" |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Failedlabel3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_failedlabel3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Csvupload_Failedlabel3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Failedlabel3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_failedlabel3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_failedlabel3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_failedlabel3(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_failedlabel3(inputs)
});
export { developerportal_dashboards_tabs_csvupload_failedlabel3 as "developerPortal.dashboards.tabs.csvUpload.failedLabel" }