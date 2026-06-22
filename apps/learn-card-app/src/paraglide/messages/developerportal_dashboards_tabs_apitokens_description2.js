/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Apitokens_Description2Inputs */

const en_developerportal_dashboards_tabs_apitokens_description2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manage tokens for server-side credential issuance`)
};

const es_developerportal_dashboards_tabs_apitokens_description2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestiona tokens para emisión de credenciales del lado del servidor`)
};

const fr_developerportal_dashboards_tabs_apitokens_description2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gérez les jetons pour l'émission de credentials côté serveur`)
};

const ar_developerportal_dashboards_tabs_apitokens_description2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إدارة الرموز لإصدار بيانات الاعتماد من جانب الخادم`)
};

/**
* | output |
* | --- |
* | "Manage tokens for server-side credential issuance" |
*
* @param {Developerportal_Dashboards_Tabs_Apitokens_Description2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_apitokens_description2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Apitokens_Description2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Apitokens_Description2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_apitokens_description2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_apitokens_description2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_apitokens_description2(inputs)
	return ar_developerportal_dashboards_tabs_apitokens_description2(inputs)
});
export { developerportal_dashboards_tabs_apitokens_description2 as "developerPortal.dashboards.tabs.apiTokens.description" }