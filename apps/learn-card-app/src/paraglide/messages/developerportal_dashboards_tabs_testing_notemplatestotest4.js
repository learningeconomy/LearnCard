/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Testing_Notemplatestotest4Inputs */

const en_developerportal_dashboards_tabs_testing_notemplatestotest4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Notemplatestotest4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No templates to test`)
};

const es_developerportal_dashboards_tabs_testing_notemplatestotest4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Notemplatestotest4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No hay plantillas para probar`)
};

const fr_developerportal_dashboards_tabs_testing_notemplatestotest4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Notemplatestotest4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun modèle à tester`)
};

const ar_developerportal_dashboards_tabs_testing_notemplatestotest4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Notemplatestotest4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد قوالب للاختبار`)
};

/**
* | output |
* | --- |
* | "No templates to test" |
*
* @param {Developerportal_Dashboards_Tabs_Testing_Notemplatestotest4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_testing_notemplatestotest4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Testing_Notemplatestotest4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Testing_Notemplatestotest4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_testing_notemplatestotest4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_testing_notemplatestotest4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_testing_notemplatestotest4(inputs)
	return ar_developerportal_dashboards_tabs_testing_notemplatestotest4(inputs)
});
export { developerportal_dashboards_tabs_testing_notemplatestotest4 as "developerPortal.dashboards.tabs.testing.noTemplatesToTest" }