/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Testing_Notemplatestotestdesc5Inputs */

const en_developerportal_dashboards_tabs_testing_notemplatestotestdesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Notemplatestotestdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create and save templates first to test credential issuance`)
};

const es_developerportal_dashboards_tabs_testing_notemplatestotestdesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Notemplatestotestdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crea y guarda plantillas primero para probar la emisión de credenciales`)
};

const fr_developerportal_dashboards_tabs_testing_notemplatestotestdesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Notemplatestotestdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créez et enregistrez d'abord des modèles pour tester l'émission de certifications`)
};

const ar_developerportal_dashboards_tabs_testing_notemplatestotestdesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Notemplatestotestdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم بإنشاء وحفظ القوالب أولاً لاختبار إصدار البيانات المعتمدة`)
};

/**
* | output |
* | --- |
* | "Create and save templates first to test credential issuance" |
*
* @param {Developerportal_Dashboards_Tabs_Testing_Notemplatestotestdesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_testing_notemplatestotestdesc5 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Testing_Notemplatestotestdesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Testing_Notemplatestotestdesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_testing_notemplatestotestdesc5(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_testing_notemplatestotestdesc5(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_testing_notemplatestotestdesc5(inputs)
	return ar_developerportal_dashboards_tabs_testing_notemplatestotestdesc5(inputs)
});
export { developerportal_dashboards_tabs_testing_notemplatestotestdesc5 as "developerPortal.dashboards.tabs.testing.noTemplatesToTestDesc" }