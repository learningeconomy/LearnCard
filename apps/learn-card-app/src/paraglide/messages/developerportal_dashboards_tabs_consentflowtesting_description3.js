/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowtesting_Description3Inputs */

const en_developerportal_dashboards_tabs_consentflowtesting_description3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Test the full consent redirect and credential sending flow`)
};

const es_developerportal_dashboards_tabs_consentflowtesting_description3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Prueba el flujo completo de redirección de consentimiento y envío de credenciales`)
};

const fr_developerportal_dashboards_tabs_consentflowtesting_description3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Testez le flux complet de redirection de consentement et d'envoi de credentials`)
};

const ar_developerportal_dashboards_tabs_consentflowtesting_description3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختبار التدفق الكامل لإعادة توجيه الموافقة وإرسال بيانات الاعتماد`)
};

/**
* | output |
* | --- |
* | "Test the full consent redirect and credential sending flow" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowtesting_Description3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowtesting_description3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowtesting_Description3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowtesting_Description3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowtesting_description3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowtesting_description3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowtesting_description3(inputs)
	return ar_developerportal_dashboards_tabs_consentflowtesting_description3(inputs)
});
export { developerportal_dashboards_tabs_consentflowtesting_description3 as "developerPortal.dashboards.tabs.consentFlowTesting.description" }