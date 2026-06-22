/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Apitokens_Howtousetitle5Inputs */

const en_developerportal_dashboards_tabs_apitokens_howtousetitle5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Howtousetitle5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`How to use your API token`)
};

const es_developerportal_dashboards_tabs_apitokens_howtousetitle5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Howtousetitle5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cómo usar tu token de API`)
};

const fr_developerportal_dashboards_tabs_apitokens_howtousetitle5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Howtousetitle5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Comment utiliser votre jeton API`)
};

const ar_developerportal_dashboards_tabs_apitokens_howtousetitle5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Howtousetitle5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`كيفية استخدام رمز API الخاص بك`)
};

/**
* | output |
* | --- |
* | "How to use your API token" |
*
* @param {Developerportal_Dashboards_Tabs_Apitokens_Howtousetitle5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_apitokens_howtousetitle5 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Apitokens_Howtousetitle5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Apitokens_Howtousetitle5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_apitokens_howtousetitle5(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_apitokens_howtousetitle5(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_apitokens_howtousetitle5(inputs)
	return ar_developerportal_dashboards_tabs_apitokens_howtousetitle5(inputs)
});
export { developerportal_dashboards_tabs_apitokens_howtousetitle5 as "developerPortal.dashboards.tabs.apiTokens.howToUseTitle" }