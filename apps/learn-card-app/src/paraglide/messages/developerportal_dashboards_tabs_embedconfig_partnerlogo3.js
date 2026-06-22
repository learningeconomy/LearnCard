/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Embedconfig_Partnerlogo3Inputs */

const en_developerportal_dashboards_tabs_embedconfig_partnerlogo3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Partnerlogo3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partner Logo`)
};

const es_developerportal_dashboards_tabs_embedconfig_partnerlogo3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Partnerlogo3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Logotipo del Socio`)
};

const fr_developerportal_dashboards_tabs_embedconfig_partnerlogo3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Partnerlogo3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Logo du Partenaire`)
};

const ar_developerportal_dashboards_tabs_embedconfig_partnerlogo3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Partnerlogo3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شعار الشريك`)
};

/**
* | output |
* | --- |
* | "Partner Logo" |
*
* @param {Developerportal_Dashboards_Tabs_Embedconfig_Partnerlogo3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_embedconfig_partnerlogo3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Embedconfig_Partnerlogo3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Embedconfig_Partnerlogo3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_embedconfig_partnerlogo3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_embedconfig_partnerlogo3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_embedconfig_partnerlogo3(inputs)
	return ar_developerportal_dashboards_tabs_embedconfig_partnerlogo3(inputs)
});
export { developerportal_dashboards_tabs_embedconfig_partnerlogo3 as "developerPortal.dashboards.tabs.embedConfig.partnerLogo" }