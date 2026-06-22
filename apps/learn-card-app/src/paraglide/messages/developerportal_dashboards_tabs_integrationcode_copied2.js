/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Integrationcode_Copied2Inputs */

const en_developerportal_dashboards_tabs_integrationcode_copied2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Copied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copied!`)
};

const es_developerportal_dashboards_tabs_integrationcode_copied2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Copied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Copiado!`)
};

const fr_developerportal_dashboards_tabs_integrationcode_copied2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Copied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copié !`)
};

const ar_developerportal_dashboards_tabs_integrationcode_copied2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Copied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم النسخ!`)
};

/**
* | output |
* | --- |
* | "Copied!" |
*
* @param {Developerportal_Dashboards_Tabs_Integrationcode_Copied2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_integrationcode_copied2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Integrationcode_Copied2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Integrationcode_Copied2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_integrationcode_copied2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_integrationcode_copied2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_integrationcode_copied2(inputs)
	return ar_developerportal_dashboards_tabs_integrationcode_copied2(inputs)
});
export { developerportal_dashboards_tabs_integrationcode_copied2 as "developerPortal.dashboards.tabs.integrationCode.copied" }