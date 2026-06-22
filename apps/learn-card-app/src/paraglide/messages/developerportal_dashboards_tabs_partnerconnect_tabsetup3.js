/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Partnerconnect_Tabsetup3Inputs */

const en_developerportal_dashboards_tabs_partnerconnect_tabsetup3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Tabsetup3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Setup`)
};

const es_developerportal_dashboards_tabs_partnerconnect_tabsetup3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Tabsetup3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configuración`)
};

const fr_developerportal_dashboards_tabs_partnerconnect_tabsetup3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Tabsetup3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configuration`)
};

const ar_developerportal_dashboards_tabs_partnerconnect_tabsetup3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Tabsetup3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الإعداد`)
};

/**
* | output |
* | --- |
* | "Setup" |
*
* @param {Developerportal_Dashboards_Tabs_Partnerconnect_Tabsetup3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_partnerconnect_tabsetup3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Partnerconnect_Tabsetup3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Partnerconnect_Tabsetup3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_partnerconnect_tabsetup3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_partnerconnect_tabsetup3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_partnerconnect_tabsetup3(inputs)
	return ar_developerportal_dashboards_tabs_partnerconnect_tabsetup3(inputs)
});
export { developerportal_dashboards_tabs_partnerconnect_tabsetup3 as "developerPortal.dashboards.tabs.partnerConnect.tabSetup" }