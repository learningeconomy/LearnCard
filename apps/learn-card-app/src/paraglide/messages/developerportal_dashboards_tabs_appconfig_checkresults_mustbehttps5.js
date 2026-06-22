/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Mustbehttps5Inputs */

const en_developerportal_dashboards_tabs_appconfig_checkresults_mustbehttps5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Mustbehttps5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Must be HTTP or HTTPS`)
};

const es_developerportal_dashboards_tabs_appconfig_checkresults_mustbehttps5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Mustbehttps5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Debe ser HTTP o HTTPS`)
};

const fr_developerportal_dashboards_tabs_appconfig_checkresults_mustbehttps5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Mustbehttps5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Doit être HTTP ou HTTPS`)
};

const ar_developerportal_dashboards_tabs_appconfig_checkresults_mustbehttps5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Mustbehttps5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يجب أن يكون HTTP أو HTTPS`)
};

/**
* | output |
* | --- |
* | "Must be HTTP or HTTPS" |
*
* @param {Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Mustbehttps5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_appconfig_checkresults_mustbehttps5 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Mustbehttps5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Mustbehttps5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_appconfig_checkresults_mustbehttps5(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_appconfig_checkresults_mustbehttps5(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_appconfig_checkresults_mustbehttps5(inputs)
	return ar_developerportal_dashboards_tabs_appconfig_checkresults_mustbehttps5(inputs)
});
export { developerportal_dashboards_tabs_appconfig_checkresults_mustbehttps5 as "developerPortal.dashboards.tabs.appConfig.checkResults.mustBeHttps" }