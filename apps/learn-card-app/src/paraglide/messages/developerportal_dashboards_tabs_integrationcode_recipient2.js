/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Integrationcode_Recipient2Inputs */

const en_developerportal_dashboards_tabs_integrationcode_recipient2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Recipient2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recipient`)
};

const es_developerportal_dashboards_tabs_integrationcode_recipient2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Recipient2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Destinatario`)
};

const fr_developerportal_dashboards_tabs_integrationcode_recipient2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Recipient2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Destinataire`)
};

const ar_developerportal_dashboards_tabs_integrationcode_recipient2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Recipient2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المستلم`)
};

/**
* | output |
* | --- |
* | "Recipient" |
*
* @param {Developerportal_Dashboards_Tabs_Integrationcode_Recipient2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_integrationcode_recipient2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Integrationcode_Recipient2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Integrationcode_Recipient2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_integrationcode_recipient2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_integrationcode_recipient2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_integrationcode_recipient2(inputs)
	return ar_developerportal_dashboards_tabs_integrationcode_recipient2(inputs)
});
export { developerportal_dashboards_tabs_integrationcode_recipient2 as "developerPortal.dashboards.tabs.integrationCode.recipient" }