/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ domain: NonNullable<unknown> }} Developerportal_Dashboards_Tabs_Embedconfig_Removedomain3Inputs */

const en_developerportal_dashboards_tabs_embedconfig_removedomain3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Removedomain3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Remove ${i?.domain}`)
};

const es_developerportal_dashboards_tabs_embedconfig_removedomain3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Removedomain3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Eliminar ${i?.domain}`)
};

const fr_developerportal_dashboards_tabs_embedconfig_removedomain3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Removedomain3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Supprimer ${i?.domain}`)
};

const ar_developerportal_dashboards_tabs_embedconfig_removedomain3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Removedomain3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`إزالة ${i?.domain}`)
};

/**
* | output |
* | --- |
* | "Remove {domain}" |
*
* @param {Developerportal_Dashboards_Tabs_Embedconfig_Removedomain3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_embedconfig_removedomain3 = /** @type {((inputs: Developerportal_Dashboards_Tabs_Embedconfig_Removedomain3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Embedconfig_Removedomain3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_embedconfig_removedomain3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_embedconfig_removedomain3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_embedconfig_removedomain3(inputs)
	return ar_developerportal_dashboards_tabs_embedconfig_removedomain3(inputs)
});
export { developerportal_dashboards_tabs_embedconfig_removedomain3 as "developerPortal.dashboards.tabs.embedConfig.removeDomain" }