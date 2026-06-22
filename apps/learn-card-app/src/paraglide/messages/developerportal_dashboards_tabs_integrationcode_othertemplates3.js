/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Integrationcode_Othertemplates3Inputs */

const en_developerportal_dashboards_tabs_integrationcode_othertemplates3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Othertemplates3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Other Templates`)
};

const es_developerportal_dashboards_tabs_integrationcode_othertemplates3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Othertemplates3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Otras Plantillas`)
};

const fr_developerportal_dashboards_tabs_integrationcode_othertemplates3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Othertemplates3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autres Modèles`)
};

const ar_developerportal_dashboards_tabs_integrationcode_othertemplates3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Othertemplates3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قوالب أخرى`)
};

/**
* | output |
* | --- |
* | "Other Templates" |
*
* @param {Developerportal_Dashboards_Tabs_Integrationcode_Othertemplates3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_integrationcode_othertemplates3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Integrationcode_Othertemplates3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Integrationcode_Othertemplates3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_integrationcode_othertemplates3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_integrationcode_othertemplates3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_integrationcode_othertemplates3(inputs)
	return ar_developerportal_dashboards_tabs_integrationcode_othertemplates3(inputs)
});
export { developerportal_dashboards_tabs_integrationcode_othertemplates3 as "developerPortal.dashboards.tabs.integrationCode.otherTemplates" }