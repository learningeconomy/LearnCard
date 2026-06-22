/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ column: NonNullable<unknown> }} Developerportal_Dashboards_Tabs_Csvupload_Willmatchto4Inputs */

const en_developerportal_dashboards_tabs_csvupload_willmatchto4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Willmatchto4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Will match "${i?.column}" values to course template names`)
};

const es_developerportal_dashboards_tabs_csvupload_willmatchto4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Willmatchto4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Coincidirá valores de "${i?.column}" con nombres de plantillas de curso`)
};

const fr_developerportal_dashboards_tabs_csvupload_willmatchto4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Willmatchto4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Fera correspondre les valeurs de "${i?.column}" aux noms des modèles de cours`)
};

const ar_developerportal_dashboards_tabs_csvupload_willmatchto4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Willmatchto4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`سيتم مطابقة قيم "${i?.column}" مع أسماء قوالب الدورات`)
};

/**
* | output |
* | --- |
* | "Will match \"{column}\" values to course template names" |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Willmatchto4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_willmatchto4 = /** @type {((inputs: Developerportal_Dashboards_Tabs_Csvupload_Willmatchto4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Willmatchto4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_willmatchto4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_willmatchto4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_willmatchto4(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_willmatchto4(inputs)
});
export { developerportal_dashboards_tabs_csvupload_willmatchto4 as "developerPortal.dashboards.tabs.csvUpload.willMatchTo" }