/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Overview_Getembedcode3Inputs */

const en_developerportal_dashboards_tabs_overview_getembedcode3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Getembedcode3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Get Embed Code`)
};

const es_developerportal_dashboards_tabs_overview_getembedcode3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Getembedcode3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtener Código de Embed`)
};

const fr_developerportal_dashboards_tabs_overview_getembedcode3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Getembedcode3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtenir le Code d'Embed`)
};

const ar_developerportal_dashboards_tabs_overview_getembedcode3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Getembedcode3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الحصول على كود التضمين`)
};

/**
* | output |
* | --- |
* | "Get Embed Code" |
*
* @param {Developerportal_Dashboards_Tabs_Overview_Getembedcode3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_overview_getembedcode3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Overview_Getembedcode3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Overview_Getembedcode3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_overview_getembedcode3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_overview_getembedcode3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_overview_getembedcode3(inputs)
	return ar_developerportal_dashboards_tabs_overview_getembedcode3(inputs)
});
export { developerportal_dashboards_tabs_overview_getembedcode3 as "developerPortal.dashboards.tabs.overview.getEmbedCode" }