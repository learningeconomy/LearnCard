/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Integrationcode_Webhookdesc3Inputs */

const en_developerportal_dashboards_tabs_integrationcode_webhookdesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Webhookdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Receive a POST request when the credential is claimed.`)
};

const es_developerportal_dashboards_tabs_integrationcode_webhookdesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Webhookdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recibe una solicitud POST cuando se reclame la credencial.`)
};

const fr_developerportal_dashboards_tabs_integrationcode_webhookdesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Webhookdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recevez une requête POST lorsque la certification est réclamée.`)
};

const ar_developerportal_dashboards_tabs_integrationcode_webhookdesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Webhookdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تلقي طلب POST عند المطالبة بالبيانات المعتمدة.`)
};

/**
* | output |
* | --- |
* | "Receive a POST request when the credential is claimed." |
*
* @param {Developerportal_Dashboards_Tabs_Integrationcode_Webhookdesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_integrationcode_webhookdesc3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Integrationcode_Webhookdesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Integrationcode_Webhookdesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_integrationcode_webhookdesc3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_integrationcode_webhookdesc3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_integrationcode_webhookdesc3(inputs)
	return ar_developerportal_dashboards_tabs_integrationcode_webhookdesc3(inputs)
});
export { developerportal_dashboards_tabs_integrationcode_webhookdesc3 as "developerPortal.dashboards.tabs.integrationCode.webhookDesc" }