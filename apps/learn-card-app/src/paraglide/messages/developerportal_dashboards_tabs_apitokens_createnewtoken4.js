/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Apitokens_Createnewtoken4Inputs */

const en_developerportal_dashboards_tabs_apitokens_createnewtoken4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Createnewtoken4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create New API Token`)
};

const es_developerportal_dashboards_tabs_apitokens_createnewtoken4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Createnewtoken4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear Nuevo Token de API`)
};

const fr_developerportal_dashboards_tabs_apitokens_createnewtoken4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Createnewtoken4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer un Nouveau Jeton API`)
};

const ar_developerportal_dashboards_tabs_apitokens_createnewtoken4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Createnewtoken4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء رمز API جديد`)
};

/**
* | output |
* | --- |
* | "Create New API Token" |
*
* @param {Developerportal_Dashboards_Tabs_Apitokens_Createnewtoken4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_apitokens_createnewtoken4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Apitokens_Createnewtoken4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Apitokens_Createnewtoken4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_apitokens_createnewtoken4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_apitokens_createnewtoken4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_apitokens_createnewtoken4(inputs)
	return ar_developerportal_dashboards_tabs_apitokens_createnewtoken4(inputs)
});
export { developerportal_dashboards_tabs_apitokens_createnewtoken4 as "developerPortal.dashboards.tabs.apiTokens.createNewToken" }