/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Issuesfound4Inputs */

const en_developerportal_dashboards_tabs_appconfig_checkresults_issuesfound4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Issuesfound4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Some issues found`)
};

const es_developerportal_dashboards_tabs_appconfig_checkresults_issuesfound4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Issuesfound4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se encontraron algunos problemas`)
};

const fr_developerportal_dashboards_tabs_appconfig_checkresults_issuesfound4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Issuesfound4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quelques problèmes trouvés`)
};

const ar_developerportal_dashboards_tabs_appconfig_checkresults_issuesfound4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Issuesfound4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم العثور على بعض المشكلات`)
};

/**
* | output |
* | --- |
* | "Some issues found" |
*
* @param {Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Issuesfound4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_appconfig_checkresults_issuesfound4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Issuesfound4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Issuesfound4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_appconfig_checkresults_issuesfound4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_appconfig_checkresults_issuesfound4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_appconfig_checkresults_issuesfound4(inputs)
	return ar_developerportal_dashboards_tabs_appconfig_checkresults_issuesfound4(inputs)
});
export { developerportal_dashboards_tabs_appconfig_checkresults_issuesfound4 as "developerPortal.dashboards.tabs.appConfig.checkResults.issuesFound" }