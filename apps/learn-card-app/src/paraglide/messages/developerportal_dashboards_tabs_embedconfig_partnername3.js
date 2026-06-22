/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Embedconfig_Partnername3Inputs */

const en_developerportal_dashboards_tabs_embedconfig_partnername3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Partnername3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partner Name`)
};

const es_developerportal_dashboards_tabs_embedconfig_partnername3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Partnername3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre del Socio`)
};

const fr_developerportal_dashboards_tabs_embedconfig_partnername3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Partnername3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom du Partenaire`)
};

const ar_developerportal_dashboards_tabs_embedconfig_partnername3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Partnername3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم الشريك`)
};

/**
* | output |
* | --- |
* | "Partner Name" |
*
* @param {Developerportal_Dashboards_Tabs_Embedconfig_Partnername3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_embedconfig_partnername3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Embedconfig_Partnername3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Embedconfig_Partnername3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_embedconfig_partnername3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_embedconfig_partnername3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_embedconfig_partnername3(inputs)
	return ar_developerportal_dashboards_tabs_embedconfig_partnername3(inputs)
});
export { developerportal_dashboards_tabs_embedconfig_partnername3 as "developerPortal.dashboards.tabs.embedConfig.partnerName" }