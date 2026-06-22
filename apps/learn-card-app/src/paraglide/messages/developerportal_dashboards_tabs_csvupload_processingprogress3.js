/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ done: NonNullable<unknown>, total: NonNullable<unknown> }} Developerportal_Dashboards_Tabs_Csvupload_Processingprogress3Inputs */

const en_developerportal_dashboards_tabs_csvupload_processingprogress3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Processingprogress3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Processing ${i?.done} / ${i?.total}...`)
};

const es_developerportal_dashboards_tabs_csvupload_processingprogress3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Processingprogress3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Procesando ${i?.done} / ${i?.total}...`)
};

const fr_developerportal_dashboards_tabs_csvupload_processingprogress3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Processingprogress3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Traitement ${i?.done} / ${i?.total}...`)
};

const ar_developerportal_dashboards_tabs_csvupload_processingprogress3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Processingprogress3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`جارٍ المعالجة ${i?.done} / ${i?.total}...`)
};

/**
* | output |
* | --- |
* | "Processing {done} / {total}..." |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Processingprogress3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_processingprogress3 = /** @type {((inputs: Developerportal_Dashboards_Tabs_Csvupload_Processingprogress3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Processingprogress3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_processingprogress3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_processingprogress3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_processingprogress3(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_processingprogress3(inputs)
});
export { developerportal_dashboards_tabs_csvupload_processingprogress3 as "developerPortal.dashboards.tabs.csvUpload.processingProgress" }