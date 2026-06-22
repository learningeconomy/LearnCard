/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Csvupload_Selectcourseidcolumn5Inputs */

const en_developerportal_dashboards_tabs_csvupload_selectcourseidcolumn5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Selectcourseidcolumn5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select course ID column...`)
};

const es_developerportal_dashboards_tabs_csvupload_selectcourseidcolumn5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Selectcourseidcolumn5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar columna de ID de curso...`)
};

const fr_developerportal_dashboards_tabs_csvupload_selectcourseidcolumn5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Selectcourseidcolumn5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner la colonne ID de cours...`)
};

const ar_developerportal_dashboards_tabs_csvupload_selectcourseidcolumn5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Selectcourseidcolumn5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر عمود معرف الدورة...`)
};

/**
* | output |
* | --- |
* | "Select course ID column..." |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Selectcourseidcolumn5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_selectcourseidcolumn5 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Csvupload_Selectcourseidcolumn5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Selectcourseidcolumn5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_selectcourseidcolumn5(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_selectcourseidcolumn5(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_selectcourseidcolumn5(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_selectcourseidcolumn5(inputs)
});
export { developerportal_dashboards_tabs_csvupload_selectcourseidcolumn5 as "developerPortal.dashboards.tabs.csvUpload.selectCourseIdColumn" }