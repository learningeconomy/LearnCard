/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Partnerconnect_Integrationcode_Templatesconfigured4Inputs */

const en_developerportal_dashboards_tabs_partnerconnect_integrationcode_templatesconfigured4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Integrationcode_Templatesconfigured4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`template(s) configured`)
};

const es_developerportal_dashboards_tabs_partnerconnect_integrationcode_templatesconfigured4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Integrationcode_Templatesconfigured4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`plantilla(s) configurada(s)`)
};

const fr_developerportal_dashboards_tabs_partnerconnect_integrationcode_templatesconfigured4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Integrationcode_Templatesconfigured4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`modèle(s) configuré(s)`)
};

const ar_developerportal_dashboards_tabs_partnerconnect_integrationcode_templatesconfigured4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Integrationcode_Templatesconfigured4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قالب (قوالب) تم تكوينها`)
};

/**
* | output |
* | --- |
* | "template(s) configured" |
*
* @param {Developerportal_Dashboards_Tabs_Partnerconnect_Integrationcode_Templatesconfigured4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_partnerconnect_integrationcode_templatesconfigured4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Partnerconnect_Integrationcode_Templatesconfigured4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Partnerconnect_Integrationcode_Templatesconfigured4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_partnerconnect_integrationcode_templatesconfigured4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_partnerconnect_integrationcode_templatesconfigured4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_partnerconnect_integrationcode_templatesconfigured4(inputs)
	return ar_developerportal_dashboards_tabs_partnerconnect_integrationcode_templatesconfigured4(inputs)
});
export { developerportal_dashboards_tabs_partnerconnect_integrationcode_templatesconfigured4 as "developerPortal.dashboards.tabs.partnerConnect.integrationCode.templatesConfigured" }