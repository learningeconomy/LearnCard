/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Apitokens_Tokencreatedfrom4Inputs */

const en_developerportal_dashboards_tabs_apitokens_tokencreatedfrom4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Tokencreatedfrom4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Created from Integration Dashboard`)
};

const es_developerportal_dashboards_tabs_apitokens_tokencreatedfrom4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Tokencreatedfrom4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creado desde el Panel de Integración`)
};

const fr_developerportal_dashboards_tabs_apitokens_tokencreatedfrom4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Tokencreatedfrom4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créé depuis le Tableau de Bord d'Intégration`)
};

const ar_developerportal_dashboards_tabs_apitokens_tokencreatedfrom4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Tokencreatedfrom4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم الإنشاء من لوحة معلومات التكامل`)
};

/**
* | output |
* | --- |
* | "Created from Integration Dashboard" |
*
* @param {Developerportal_Dashboards_Tabs_Apitokens_Tokencreatedfrom4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_apitokens_tokencreatedfrom4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Apitokens_Tokencreatedfrom4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Apitokens_Tokencreatedfrom4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_apitokens_tokencreatedfrom4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_apitokens_tokencreatedfrom4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_apitokens_tokencreatedfrom4(inputs)
	return ar_developerportal_dashboards_tabs_apitokens_tokencreatedfrom4(inputs)
});
export { developerportal_dashboards_tabs_apitokens_tokencreatedfrom4 as "developerPortal.dashboards.tabs.apiTokens.tokenCreatedFrom" }