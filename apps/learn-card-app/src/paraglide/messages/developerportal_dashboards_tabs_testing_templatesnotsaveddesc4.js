/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Testing_Templatesnotsaveddesc4Inputs */

const en_developerportal_dashboards_tabs_testing_templatesnotsaveddesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Templatesnotsaveddesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save your templates first to be able to test them. Only saved templates can be used for testing.`)
};

const es_developerportal_dashboards_tabs_testing_templatesnotsaveddesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Templatesnotsaveddesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guarda tus plantillas primero para poder probarlas. Solo las plantillas guardadas se pueden usar para pruebas.`)
};

const fr_developerportal_dashboards_tabs_testing_templatesnotsaveddesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Templatesnotsaveddesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sauvegardez d'abord vos modèles pour pouvoir les tester. Seuls les modèles sauvegardés peuvent être utilisés pour les tests.`)
};

const ar_developerportal_dashboards_tabs_testing_templatesnotsaveddesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Templatesnotsaveddesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`احفظ قوالبك أولاً لتتمكن من اختبارها. يمكن استخدام القوالب المحفوظة فقط للاختبار.`)
};

/**
* | output |
* | --- |
* | "Save your templates first to be able to test them. Only saved templates can be used for testing." |
*
* @param {Developerportal_Dashboards_Tabs_Testing_Templatesnotsaveddesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_testing_templatesnotsaveddesc4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Testing_Templatesnotsaveddesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Testing_Templatesnotsaveddesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_testing_templatesnotsaveddesc4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_testing_templatesnotsaveddesc4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_testing_templatesnotsaveddesc4(inputs)
	return ar_developerportal_dashboards_tabs_testing_templatesnotsaveddesc4(inputs)
});
export { developerportal_dashboards_tabs_testing_templatesnotsaveddesc4 as "developerPortal.dashboards.tabs.testing.templatesNotSavedDesc" }