/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Appconfig_Requiredheadersdesc4Inputs */

const en_developerportal_dashboards_tabs_appconfig_requiredheadersdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Requiredheadersdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configure your server to allow iframe embedding`)
};

const es_developerportal_dashboards_tabs_appconfig_requiredheadersdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Requiredheadersdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configura tu servidor para permitir la incrustación en iframe`)
};

const fr_developerportal_dashboards_tabs_appconfig_requiredheadersdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Requiredheadersdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurez votre serveur pour autoriser l'intégration iframe`)
};

const ar_developerportal_dashboards_tabs_appconfig_requiredheadersdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Requiredheadersdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم بتكوين خادمك للسماح بالتضمين في iframe`)
};

/**
* | output |
* | --- |
* | "Configure your server to allow iframe embedding" |
*
* @param {Developerportal_Dashboards_Tabs_Appconfig_Requiredheadersdesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_appconfig_requiredheadersdesc4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Appconfig_Requiredheadersdesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Appconfig_Requiredheadersdesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_appconfig_requiredheadersdesc4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_appconfig_requiredheadersdesc4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_appconfig_requiredheadersdesc4(inputs)
	return ar_developerportal_dashboards_tabs_appconfig_requiredheadersdesc4(inputs)
});
export { developerportal_dashboards_tabs_appconfig_requiredheadersdesc4 as "developerPortal.dashboards.tabs.appConfig.requiredHeadersDesc" }