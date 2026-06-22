/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Integrationcode_Copyconfig3Inputs */

const en_developerportal_dashboards_tabs_integrationcode_copyconfig3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Copyconfig3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy Config`)
};

const es_developerportal_dashboards_tabs_integrationcode_copyconfig3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Copyconfig3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copiar Configuración`)
};

const fr_developerportal_dashboards_tabs_integrationcode_copyconfig3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Copyconfig3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copier la Configuration`)
};

const ar_developerportal_dashboards_tabs_integrationcode_copyconfig3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Copyconfig3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نسخ الإعدادات`)
};

/**
* | output |
* | --- |
* | "Copy Config" |
*
* @param {Developerportal_Dashboards_Tabs_Integrationcode_Copyconfig3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_integrationcode_copyconfig3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Integrationcode_Copyconfig3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Integrationcode_Copyconfig3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_integrationcode_copyconfig3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_integrationcode_copyconfig3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_integrationcode_copyconfig3(inputs)
	return ar_developerportal_dashboards_tabs_integrationcode_copyconfig3(inputs)
});
export { developerportal_dashboards_tabs_integrationcode_copyconfig3 as "developerPortal.dashboards.tabs.integrationCode.copyConfig" }