/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Testing_Description1Inputs */

const en_developerportal_dashboards_tabs_testing_description1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send a test credential to verify your integration works`)
};

const es_developerportal_dashboards_tabs_testing_description1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envía una credencial de prueba para verificar que tu integración funcione`)
};

const fr_developerportal_dashboards_tabs_testing_description1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyez un credential de test pour vérifier que votre intégration fonctionne`)
};

const ar_developerportal_dashboards_tabs_testing_description1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أرسل بيانات اعتماد اختبارية للتحقق من أن التكامل يعمل`)
};

/**
* | output |
* | --- |
* | "Send a test credential to verify your integration works" |
*
* @param {Developerportal_Dashboards_Tabs_Testing_Description1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_testing_description1 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Testing_Description1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Testing_Description1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_testing_description1(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_testing_description1(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_testing_description1(inputs)
	return ar_developerportal_dashboards_tabs_testing_description1(inputs)
});
export { developerportal_dashboards_tabs_testing_description1 as "developerPortal.dashboards.tabs.testing.description" }