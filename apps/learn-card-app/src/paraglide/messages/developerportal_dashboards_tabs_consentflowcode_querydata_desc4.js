/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowcode_Querydata_Desc4Inputs */

const en_developerportal_dashboards_tabs_consentflowcode_querydata_desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Querydata_Desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retrieve consent records and connected users`)
};

const es_developerportal_dashboards_tabs_consentflowcode_querydata_desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Querydata_Desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recupera registros de consentimiento y usuarios conectados`)
};

const fr_developerportal_dashboards_tabs_consentflowcode_querydata_desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Querydata_Desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Récupérez les enregistrements de consentement et les utilisateurs connectés`)
};

const ar_developerportal_dashboards_tabs_consentflowcode_querydata_desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Querydata_Desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استرجاع سجلات الموافقة والمستخدمين المتصلين`)
};

/**
* | output |
* | --- |
* | "Retrieve consent records and connected users" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowcode_Querydata_Desc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowcode_querydata_desc4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowcode_Querydata_Desc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowcode_Querydata_Desc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowcode_querydata_desc4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowcode_querydata_desc4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowcode_querydata_desc4(inputs)
	return ar_developerportal_dashboards_tabs_consentflowcode_querydata_desc4(inputs)
});
export { developerportal_dashboards_tabs_consentflowcode_querydata_desc4 as "developerPortal.dashboards.tabs.consentFlowCode.queryData.desc" }