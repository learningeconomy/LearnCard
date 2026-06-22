/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Csvupload_Requiredcolumnsfortemplate5Inputs */

const en_developerportal_dashboards_tabs_csvupload_requiredcolumnsfortemplate5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Requiredcolumnsfortemplate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Required columns for this template:`)
};

const es_developerportal_dashboards_tabs_csvupload_requiredcolumnsfortemplate5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Requiredcolumnsfortemplate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Columnas requeridas para esta plantilla:`)
};

const fr_developerportal_dashboards_tabs_csvupload_requiredcolumnsfortemplate5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Requiredcolumnsfortemplate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Colonnes requises pour ce modèle :`)
};

const ar_developerportal_dashboards_tabs_csvupload_requiredcolumnsfortemplate5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Requiredcolumnsfortemplate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الأعمدة المطلوبة لهذا القالب:`)
};

/**
* | output |
* | --- |
* | "Required columns for this template:" |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Requiredcolumnsfortemplate5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_requiredcolumnsfortemplate5 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Csvupload_Requiredcolumnsfortemplate5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Requiredcolumnsfortemplate5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_requiredcolumnsfortemplate5(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_requiredcolumnsfortemplate5(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_requiredcolumnsfortemplate5(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_requiredcolumnsfortemplate5(inputs)
});
export { developerportal_dashboards_tabs_csvupload_requiredcolumnsfortemplate5 as "developerPortal.dashboards.tabs.csvUpload.requiredColumnsForTemplate" }