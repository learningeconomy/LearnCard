/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Embedconfig_Add2Inputs */

const en_developerportal_dashboards_tabs_embedconfig_add2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Add2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add`)
};

const es_developerportal_dashboards_tabs_embedconfig_add2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Add2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir`)
};

const fr_developerportal_dashboards_tabs_embedconfig_add2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Add2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter`)
};

const ar_developerportal_dashboards_tabs_embedconfig_add2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Add2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة`)
};

/**
* | output |
* | --- |
* | "Add" |
*
* @param {Developerportal_Dashboards_Tabs_Embedconfig_Add2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_embedconfig_add2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Embedconfig_Add2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Embedconfig_Add2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_embedconfig_add2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_embedconfig_add2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_embedconfig_add2(inputs)
	return ar_developerportal_dashboards_tabs_embedconfig_add2(inputs)
});
export { developerportal_dashboards_tabs_embedconfig_add2 as "developerPortal.dashboards.tabs.embedConfig.add" }