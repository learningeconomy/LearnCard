/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Checking3Inputs */

const en_developerportal_dashboards_tabs_appconfig_checkresults_checking3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Checking3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Checking your URL...`)
};

const es_developerportal_dashboards_tabs_appconfig_checkresults_checking3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Checking3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verificando tu URL...`)
};

const fr_developerportal_dashboards_tabs_appconfig_checkresults_checking3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Checking3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérification de votre URL...`)
};

const ar_developerportal_dashboards_tabs_appconfig_checkresults_checking3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Checking3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري التحقق من الرابط...`)
};

/**
* | output |
* | --- |
* | "Checking your URL..." |
*
* @param {Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Checking3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_appconfig_checkresults_checking3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Checking3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Checking3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_appconfig_checkresults_checking3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_appconfig_checkresults_checking3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_appconfig_checkresults_checking3(inputs)
	return ar_developerportal_dashboards_tabs_appconfig_checkresults_checking3(inputs)
});
export { developerportal_dashboards_tabs_appconfig_checkresults_checking3 as "developerPortal.dashboards.tabs.appConfig.checkResults.checking" }