/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Partnerconnect_Installation_Stepinstall3Inputs */

const en_developerportal_dashboards_tabs_partnerconnect_installation_stepinstall3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Installation_Stepinstall3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`1. Install the SDK`)
};

const es_developerportal_dashboards_tabs_partnerconnect_installation_stepinstall3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Installation_Stepinstall3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`1. Instalar el SDK`)
};

const fr_developerportal_dashboards_tabs_partnerconnect_installation_stepinstall3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Installation_Stepinstall3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`1. Installer le SDK`)
};

const ar_developerportal_dashboards_tabs_partnerconnect_installation_stepinstall3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Installation_Stepinstall3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`1. تثبيت SDK`)
};

/**
* | output |
* | --- |
* | "1. Install the SDK" |
*
* @param {Developerportal_Dashboards_Tabs_Partnerconnect_Installation_Stepinstall3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_partnerconnect_installation_stepinstall3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Partnerconnect_Installation_Stepinstall3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Partnerconnect_Installation_Stepinstall3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_partnerconnect_installation_stepinstall3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_partnerconnect_installation_stepinstall3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_partnerconnect_installation_stepinstall3(inputs)
	return ar_developerportal_dashboards_tabs_partnerconnect_installation_stepinstall3(inputs)
});
export { developerportal_dashboards_tabs_partnerconnect_installation_stepinstall3 as "developerPortal.dashboards.tabs.partnerConnect.installation.stepInstall" }