/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Fixissues4Inputs */

const en_developerportal_dashboards_tabs_appconfig_checkresults_fixissues4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Fixissues4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fix the issues above before going live. See header examples below.`)
};

const es_developerportal_dashboards_tabs_appconfig_checkresults_fixissues4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Fixissues4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Corrige los problemas anteriores antes de publicar. Ve los ejemplos de encabezados abajo.`)
};

const fr_developerportal_dashboards_tabs_appconfig_checkresults_fixissues4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Fixissues4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Corrigez les problèmes ci-dessus avant la mise en ligne. Voir les exemples d'en-têtes ci-dessous.`)
};

const ar_developerportal_dashboards_tabs_appconfig_checkresults_fixissues4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Fixissues4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أصلح المشكلات أعلاه قبل النشر. انظر أمثلة الرؤوس أدناه.`)
};

/**
* | output |
* | --- |
* | "Fix the issues above before going live. See header examples below." |
*
* @param {Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Fixissues4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_appconfig_checkresults_fixissues4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Fixissues4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Appconfig_Checkresults_Fixissues4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_appconfig_checkresults_fixissues4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_appconfig_checkresults_fixissues4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_appconfig_checkresults_fixissues4(inputs)
	return ar_developerportal_dashboards_tabs_appconfig_checkresults_fixissues4(inputs)
});
export { developerportal_dashboards_tabs_appconfig_checkresults_fixissues4 as "developerPortal.dashboards.tabs.appConfig.checkResults.fixIssues" }