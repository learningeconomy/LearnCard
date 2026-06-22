/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Csvupload_Courseidcolumnlabel5Inputs */

const en_developerportal_dashboards_tabs_csvupload_courseidcolumnlabel5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Courseidcolumnlabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`course id *`)
};

const es_developerportal_dashboards_tabs_csvupload_courseidcolumnlabel5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Courseidcolumnlabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`id del curso *`)
};

const fr_developerportal_dashboards_tabs_csvupload_courseidcolumnlabel5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Courseidcolumnlabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`id du cours *`)
};

const ar_developerportal_dashboards_tabs_csvupload_courseidcolumnlabel5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Courseidcolumnlabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معرف الدورة *`)
};

/**
* | output |
* | --- |
* | "course id *" |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Courseidcolumnlabel5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_courseidcolumnlabel5 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Csvupload_Courseidcolumnlabel5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Courseidcolumnlabel5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_courseidcolumnlabel5(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_courseidcolumnlabel5(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_courseidcolumnlabel5(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_courseidcolumnlabel5(inputs)
});
export { developerportal_dashboards_tabs_csvupload_courseidcolumnlabel5 as "developerPortal.dashboards.tabs.csvUpload.courseIdColumnLabel" }