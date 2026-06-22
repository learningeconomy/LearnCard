/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Csvupload_Pendinglabel3Inputs */

const en_developerportal_dashboards_tabs_csvupload_pendinglabel3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Pendinglabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`pending`)
};

const es_developerportal_dashboards_tabs_csvupload_pendinglabel3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Pendinglabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`pendiente`)
};

const fr_developerportal_dashboards_tabs_csvupload_pendinglabel3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Pendinglabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`en attente`)
};

const ar_developerportal_dashboards_tabs_csvupload_pendinglabel3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Pendinglabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قيد الانتظار`)
};

/**
* | output |
* | --- |
* | "pending" |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Pendinglabel3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_pendinglabel3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Csvupload_Pendinglabel3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Pendinglabel3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_pendinglabel3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_pendinglabel3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_pendinglabel3(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_pendinglabel3(inputs)
});
export { developerportal_dashboards_tabs_csvupload_pendinglabel3 as "developerPortal.dashboards.tabs.csvUpload.pendingLabel" }