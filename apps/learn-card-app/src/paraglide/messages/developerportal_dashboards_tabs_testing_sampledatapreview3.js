/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Testing_Sampledatapreview3Inputs */

const en_developerportal_dashboards_tabs_testing_sampledatapreview3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Sampledatapreview3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sample Data Preview`)
};

const es_developerportal_dashboards_tabs_testing_sampledatapreview3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Sampledatapreview3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vista Previa de Datos de Muestra`)
};

const fr_developerportal_dashboards_tabs_testing_sampledatapreview3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Sampledatapreview3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aperçu des Exemples de Données`)
};

const ar_developerportal_dashboards_tabs_testing_sampledatapreview3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Sampledatapreview3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معاينة البيانات النموذجية`)
};

/**
* | output |
* | --- |
* | "Sample Data Preview" |
*
* @param {Developerportal_Dashboards_Tabs_Testing_Sampledatapreview3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_testing_sampledatapreview3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Testing_Sampledatapreview3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Testing_Sampledatapreview3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_testing_sampledatapreview3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_testing_sampledatapreview3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_testing_sampledatapreview3(inputs)
	return ar_developerportal_dashboards_tabs_testing_sampledatapreview3(inputs)
});
export { developerportal_dashboards_tabs_testing_sampledatapreview3 as "developerPortal.dashboards.tabs.testing.sampleDataPreview" }