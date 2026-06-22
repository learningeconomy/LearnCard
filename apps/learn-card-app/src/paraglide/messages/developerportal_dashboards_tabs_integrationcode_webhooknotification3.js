/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Integrationcode_Webhooknotification3Inputs */

const en_developerportal_dashboards_tabs_integrationcode_webhooknotification3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Webhooknotification3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Webhook Notification`)
};

const es_developerportal_dashboards_tabs_integrationcode_webhooknotification3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Webhooknotification3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Notificación Webhook`)
};

const fr_developerportal_dashboards_tabs_integrationcode_webhooknotification3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Webhooknotification3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Notification Webhook`)
};

const ar_developerportal_dashboards_tabs_integrationcode_webhooknotification3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Webhooknotification3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إشعار Webhook`)
};

/**
* | output |
* | --- |
* | "Webhook Notification" |
*
* @param {Developerportal_Dashboards_Tabs_Integrationcode_Webhooknotification3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_integrationcode_webhooknotification3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Integrationcode_Webhooknotification3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Integrationcode_Webhooknotification3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_integrationcode_webhooknotification3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_integrationcode_webhooknotification3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_integrationcode_webhooknotification3(inputs)
	return ar_developerportal_dashboards_tabs_integrationcode_webhooknotification3(inputs)
});
export { developerportal_dashboards_tabs_integrationcode_webhooknotification3 as "developerPortal.dashboards.tabs.integrationCode.webhookNotification" }