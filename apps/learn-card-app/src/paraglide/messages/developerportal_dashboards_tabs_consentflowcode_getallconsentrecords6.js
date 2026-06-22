/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowcode_Getallconsentrecords6Inputs */

const en_developerportal_dashboards_tabs_consentflowcode_getallconsentrecords6 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Getallconsentrecords6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Get all consent records for your contract`)
};

const es_developerportal_dashboards_tabs_consentflowcode_getallconsentrecords6 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Getallconsentrecords6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtener todos los registros de consentimiento de su contrato`)
};

const fr_developerportal_dashboards_tabs_consentflowcode_getallconsentrecords6 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Getallconsentrecords6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtenir tous les enregistrements de consentement pour votre contrat`)
};

const ar_developerportal_dashboards_tabs_consentflowcode_getallconsentrecords6 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Getallconsentrecords6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الحصول على جميع سجلات الموافقة لعقدك`)
};

/**
* | output |
* | --- |
* | "Get all consent records for your contract" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowcode_Getallconsentrecords6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowcode_getallconsentrecords6 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowcode_Getallconsentrecords6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowcode_Getallconsentrecords6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowcode_getallconsentrecords6(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowcode_getallconsentrecords6(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowcode_getallconsentrecords6(inputs)
	return ar_developerportal_dashboards_tabs_consentflowcode_getallconsentrecords6(inputs)
});
export { developerportal_dashboards_tabs_consentflowcode_getallconsentrecords6 as "developerPortal.dashboards.tabs.consentFlowCode.getAllConsentRecords" }