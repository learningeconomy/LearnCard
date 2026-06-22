/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Apitokens_Createtoken3Inputs */

const en_developerportal_dashboards_tabs_apitokens_createtoken3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Createtoken3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Token`)
};

const es_developerportal_dashboards_tabs_apitokens_createtoken3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Createtoken3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear Token`)
};

const fr_developerportal_dashboards_tabs_apitokens_createtoken3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Createtoken3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer un Jeton`)
};

const ar_developerportal_dashboards_tabs_apitokens_createtoken3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Createtoken3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء رمز`)
};

/**
* | output |
* | --- |
* | "Create Token" |
*
* @param {Developerportal_Dashboards_Tabs_Apitokens_Createtoken3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_apitokens_createtoken3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Apitokens_Createtoken3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Apitokens_Createtoken3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_apitokens_createtoken3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_apitokens_createtoken3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_apitokens_createtoken3(inputs)
	return ar_developerportal_dashboards_tabs_apitokens_createtoken3(inputs)
});
export { developerportal_dashboards_tabs_apitokens_createtoken3 as "developerPortal.dashboards.tabs.apiTokens.createToken" }