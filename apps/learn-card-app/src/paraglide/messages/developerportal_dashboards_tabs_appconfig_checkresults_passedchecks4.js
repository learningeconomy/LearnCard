/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Passedchecks4Inputs */

const en_developerportal_dashboards_tabs_appconfig_checkresults_passedchecks4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Passedchecks4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your URL passed basic checks. You may still need to configure iframe headers (X-Frame-Options).`)
};

const es_developerportal_dashboards_tabs_appconfig_checkresults_passedchecks4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Passedchecks4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu URL pasó las verificaciones básicas. Es posible que aún necesites configurar los encabezados de iframe (X-Frame-Options).`)
};

const fr_developerportal_dashboards_tabs_appconfig_checkresults_passedchecks4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Passedchecks4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre URL a passé les vérifications de base. Vous devrez peut-être encore configurer les en-têtes iframe (X-Frame-Options).`)
};

const ar_developerportal_dashboards_tabs_appconfig_checkresults_passedchecks4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Passedchecks4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اجتاز الرابط الفحوصات الأساسية. قد لا تزال بحاجة إلى تكوين رؤوس iframe (X-Frame-Options).`)
};

/**
* | output |
* | --- |
* | "Your URL passed basic checks. You may still need to configure iframe headers (X-Frame-Options)." |
*
* @param {Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Passedchecks4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_appconfig_checkresults_passedchecks4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Passedchecks4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Passedchecks4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_appconfig_checkresults_passedchecks4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_appconfig_checkresults_passedchecks4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_appconfig_checkresults_passedchecks4(inputs)
	return ar_developerportal_dashboards_tabs_appconfig_checkresults_passedchecks4(inputs)
});
export { developerportal_dashboards_tabs_appconfig_checkresults_passedchecks4 as "developerPortal.dashboards.tabs.appConfig.checkResults.passedChecks" }