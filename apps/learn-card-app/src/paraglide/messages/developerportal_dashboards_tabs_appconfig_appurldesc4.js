/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Appconfig_Appurldesc4Inputs */

const en_developerportal_dashboards_tabs_appconfig_appurldesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Appurldesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`The URL of your app that will be embedded in LearnCard`)
};

const es_developerportal_dashboards_tabs_appconfig_appurldesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Appurldesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La URL de tu aplicación que se incrustará en LearnCard`)
};

const fr_developerportal_dashboards_tabs_appconfig_appurldesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Appurldesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`L'URL de votre application qui sera intégrée dans LearnCard`)
};

const ar_developerportal_dashboards_tabs_appconfig_appurldesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Appurldesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رابط تطبيقك الذي سيتم تضمينه في LearnCard`)
};

/**
* | output |
* | --- |
* | "The URL of your app that will be embedded in LearnCard" |
*
* @param {Developerportal_Dashboards_Tabs_Appconfig_Appurldesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_appconfig_appurldesc4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Appconfig_Appurldesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Appconfig_Appurldesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_appconfig_appurldesc4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_appconfig_appurldesc4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_appconfig_appurldesc4(inputs)
	return ar_developerportal_dashboards_tabs_appconfig_appurldesc4(inputs)
});
export { developerportal_dashboards_tabs_appconfig_appurldesc4 as "developerPortal.dashboards.tabs.appConfig.appUrlDesc" }