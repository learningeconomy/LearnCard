/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Httpsrequired4Inputs */

const en_developerportal_dashboards_tabs_appconfig_checkresults_httpsrequired4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Httpsrequired4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`HTTPS required for production`)
};

const es_developerportal_dashboards_tabs_appconfig_checkresults_httpsrequired4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Httpsrequired4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se requiere HTTPS para producción`)
};

const fr_developerportal_dashboards_tabs_appconfig_checkresults_httpsrequired4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Httpsrequired4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`HTTPS requis pour la production`)
};

const ar_developerportal_dashboards_tabs_appconfig_checkresults_httpsrequired4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Httpsrequired4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`HTTPS مطلوب للإنتاج`)
};

/**
* | output |
* | --- |
* | "HTTPS required for production" |
*
* @param {Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Httpsrequired4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_appconfig_checkresults_httpsrequired4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Httpsrequired4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Httpsrequired4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_appconfig_checkresults_httpsrequired4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_appconfig_checkresults_httpsrequired4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_appconfig_checkresults_httpsrequired4(inputs)
	return ar_developerportal_dashboards_tabs_appconfig_checkresults_httpsrequired4(inputs)
});
export { developerportal_dashboards_tabs_appconfig_checkresults_httpsrequired4 as "developerPortal.dashboards.tabs.appConfig.checkResults.httpsRequired" }