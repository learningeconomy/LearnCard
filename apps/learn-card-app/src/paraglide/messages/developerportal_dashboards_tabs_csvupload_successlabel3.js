/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Csvupload_Successlabel3Inputs */

const en_developerportal_dashboards_tabs_csvupload_successlabel3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Successlabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`success`)
};

const es_developerportal_dashboards_tabs_csvupload_successlabel3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Successlabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`éxito`)
};

const fr_developerportal_dashboards_tabs_csvupload_successlabel3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Successlabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`succès`)
};

const ar_developerportal_dashboards_tabs_csvupload_successlabel3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Successlabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نجاح`)
};

/**
* | output |
* | --- |
* | "success" |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Successlabel3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_successlabel3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Csvupload_Successlabel3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Successlabel3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_successlabel3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_successlabel3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_successlabel3(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_successlabel3(inputs)
});
export { developerportal_dashboards_tabs_csvupload_successlabel3 as "developerPortal.dashboards.tabs.csvUpload.successLabel" }