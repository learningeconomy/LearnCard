/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Embedconfig_Domainadded3Inputs */

const en_developerportal_dashboards_tabs_embedconfig_domainadded3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Domainadded3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Domain added`)
};

const es_developerportal_dashboards_tabs_embedconfig_domainadded3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Domainadded3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dominio añadido`)
};

const fr_developerportal_dashboards_tabs_embedconfig_domainadded3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Domainadded3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Domaine ajouté`)
};

const ar_developerportal_dashboards_tabs_embedconfig_domainadded3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Domainadded3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تمت إضافة المجال`)
};

/**
* | output |
* | --- |
* | "Domain added" |
*
* @param {Developerportal_Dashboards_Tabs_Embedconfig_Domainadded3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_embedconfig_domainadded3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Embedconfig_Domainadded3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Embedconfig_Domainadded3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_embedconfig_domainadded3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_embedconfig_domainadded3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_embedconfig_domainadded3(inputs)
	return ar_developerportal_dashboards_tabs_embedconfig_domainadded3(inputs)
});
export { developerportal_dashboards_tabs_embedconfig_domainadded3 as "developerPortal.dashboards.tabs.embedConfig.domainAdded" }