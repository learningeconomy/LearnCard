/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Overview_Description1Inputs */

const en_developerportal_dashboards_tabs_overview_description1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Common tasks for managing your integration`)
};

const es_developerportal_dashboards_tabs_overview_description1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tareas comunes para gestionar tu integración`)
};

const fr_developerportal_dashboards_tabs_overview_description1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tâches courantes pour gérer votre intégration`)
};

const ar_developerportal_dashboards_tabs_overview_description1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المهام الشائعة لإدارة تكاملك`)
};

/**
* | output |
* | --- |
* | "Common tasks for managing your integration" |
*
* @param {Developerportal_Dashboards_Tabs_Overview_Description1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_overview_description1 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Overview_Description1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Overview_Description1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_overview_description1(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_overview_description1(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_overview_description1(inputs)
	return ar_developerportal_dashboards_tabs_overview_description1(inputs)
});
export { developerportal_dashboards_tabs_overview_description1 as "developerPortal.dashboards.tabs.overview.description" }