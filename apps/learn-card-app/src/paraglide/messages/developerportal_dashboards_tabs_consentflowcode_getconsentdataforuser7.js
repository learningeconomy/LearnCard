/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowcode_Getconsentdataforuser7Inputs */

const en_developerportal_dashboards_tabs_consentflowcode_getconsentdataforuser7 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Getconsentdataforuser7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Get consent data for a specific user`)
};

const es_developerportal_dashboards_tabs_consentflowcode_getconsentdataforuser7 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Getconsentdataforuser7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtener datos de consentimiento para un usuario específico`)
};

const fr_developerportal_dashboards_tabs_consentflowcode_getconsentdataforuser7 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Getconsentdataforuser7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtenir les données de consentement pour un utilisateur spécifique`)
};

const ar_developerportal_dashboards_tabs_consentflowcode_getconsentdataforuser7 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Getconsentdataforuser7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الحصول على بيانات الموافقة لمستخدم معين`)
};

/**
* | output |
* | --- |
* | "Get consent data for a specific user" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowcode_Getconsentdataforuser7Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowcode_getconsentdataforuser7 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowcode_Getconsentdataforuser7Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowcode_Getconsentdataforuser7Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowcode_getconsentdataforuser7(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowcode_getconsentdataforuser7(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowcode_getconsentdataforuser7(inputs)
	return ar_developerportal_dashboards_tabs_consentflowcode_getconsentdataforuser7(inputs)
});
export { developerportal_dashboards_tabs_consentflowcode_getconsentdataforuser7 as "developerPortal.dashboards.tabs.consentFlowCode.getConsentDataForUser" }