/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Appconfig_Blankiframe3Inputs */

const en_developerportal_dashboards_tabs_appconfig_blankiframe3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Blankiframe3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Blank iframe?`)
};

const es_developerportal_dashboards_tabs_appconfig_blankiframe3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Blankiframe3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Iframe en blanco?`)
};

const fr_developerportal_dashboards_tabs_appconfig_blankiframe3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Blankiframe3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Iframe vide ?`)
};

const ar_developerportal_dashboards_tabs_appconfig_blankiframe3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Blankiframe3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`iframe فارغ؟`)
};

/**
* | output |
* | --- |
* | "Blank iframe?" |
*
* @param {Developerportal_Dashboards_Tabs_Appconfig_Blankiframe3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_appconfig_blankiframe3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Appconfig_Blankiframe3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Appconfig_Blankiframe3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_appconfig_blankiframe3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_appconfig_blankiframe3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_appconfig_blankiframe3(inputs)
	return ar_developerportal_dashboards_tabs_appconfig_blankiframe3(inputs)
});
export { developerportal_dashboards_tabs_appconfig_blankiframe3 as "developerPortal.dashboards.tabs.appConfig.blankIframe" }