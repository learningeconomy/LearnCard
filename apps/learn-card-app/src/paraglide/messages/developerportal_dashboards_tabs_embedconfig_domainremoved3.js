/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Embedconfig_Domainremoved3Inputs */

const en_developerportal_dashboards_tabs_embedconfig_domainremoved3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Domainremoved3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Domain removed`)
};

const es_developerportal_dashboards_tabs_embedconfig_domainremoved3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Domainremoved3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dominio eliminado`)
};

const fr_developerportal_dashboards_tabs_embedconfig_domainremoved3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Domainremoved3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Domaine supprimé`)
};

const ar_developerportal_dashboards_tabs_embedconfig_domainremoved3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Domainremoved3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تمت إزالة المجال`)
};

/**
* | output |
* | --- |
* | "Domain removed" |
*
* @param {Developerportal_Dashboards_Tabs_Embedconfig_Domainremoved3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_embedconfig_domainremoved3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Embedconfig_Domainremoved3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Embedconfig_Domainremoved3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_embedconfig_domainremoved3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_embedconfig_domainremoved3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_embedconfig_domainremoved3(inputs)
	return ar_developerportal_dashboards_tabs_embedconfig_domainremoved3(inputs)
});
export { developerportal_dashboards_tabs_embedconfig_domainremoved3 as "developerPortal.dashboards.tabs.embedConfig.domainRemoved" }