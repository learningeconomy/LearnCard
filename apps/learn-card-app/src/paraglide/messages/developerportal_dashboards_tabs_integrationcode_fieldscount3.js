/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Integrationcode_Fieldscount3Inputs */

const en_developerportal_dashboards_tabs_integrationcode_fieldscount3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Fieldscount3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`field(s)`)
};

const es_developerportal_dashboards_tabs_integrationcode_fieldscount3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Fieldscount3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`campo(s)`)
};

const fr_developerportal_dashboards_tabs_integrationcode_fieldscount3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Fieldscount3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`champ(s)`)
};

const ar_developerportal_dashboards_tabs_integrationcode_fieldscount3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Fieldscount3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حقل (حقول)`)
};

/**
* | output |
* | --- |
* | "field(s)" |
*
* @param {Developerportal_Dashboards_Tabs_Integrationcode_Fieldscount3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_integrationcode_fieldscount3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Integrationcode_Fieldscount3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Integrationcode_Fieldscount3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_integrationcode_fieldscount3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_integrationcode_fieldscount3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_integrationcode_fieldscount3(inputs)
	return ar_developerportal_dashboards_tabs_integrationcode_fieldscount3(inputs)
});
export { developerportal_dashboards_tabs_integrationcode_fieldscount3 as "developerPortal.dashboards.tabs.integrationCode.fieldsCount" }