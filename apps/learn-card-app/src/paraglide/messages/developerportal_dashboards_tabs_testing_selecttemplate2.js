/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Testing_Selecttemplate2Inputs */

const en_developerportal_dashboards_tabs_testing_selecttemplate2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Selecttemplate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select Template to Test`)
};

const es_developerportal_dashboards_tabs_testing_selecttemplate2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Selecttemplate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar Plantilla para Probar`)
};

const fr_developerportal_dashboards_tabs_testing_selecttemplate2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Selecttemplate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner un Modèle à Tester`)
};

const ar_developerportal_dashboards_tabs_testing_selecttemplate2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Selecttemplate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختيار قالب للاختبار`)
};

/**
* | output |
* | --- |
* | "Select Template to Test" |
*
* @param {Developerportal_Dashboards_Tabs_Testing_Selecttemplate2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_testing_selecttemplate2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Testing_Selecttemplate2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Testing_Selecttemplate2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_testing_selecttemplate2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_testing_selecttemplate2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_testing_selecttemplate2(inputs)
	return ar_developerportal_dashboards_tabs_testing_selecttemplate2(inputs)
});
export { developerportal_dashboards_tabs_testing_selecttemplate2 as "developerPortal.dashboards.tabs.testing.selectTemplate" }