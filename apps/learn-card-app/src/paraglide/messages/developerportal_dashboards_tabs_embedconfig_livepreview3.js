/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Embedconfig_Livepreview3Inputs */

const en_developerportal_dashboards_tabs_embedconfig_livepreview3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Livepreview3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Live Preview`)
};

const es_developerportal_dashboards_tabs_embedconfig_livepreview3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Livepreview3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vista Previa en Vivo`)
};

const fr_developerportal_dashboards_tabs_embedconfig_livepreview3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Livepreview3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aperçu en Direct`)
};

const ar_developerportal_dashboards_tabs_embedconfig_livepreview3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Livepreview3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معاينة مباشرة`)
};

/**
* | output |
* | --- |
* | "Live Preview" |
*
* @param {Developerportal_Dashboards_Tabs_Embedconfig_Livepreview3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_embedconfig_livepreview3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Embedconfig_Livepreview3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Embedconfig_Livepreview3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_embedconfig_livepreview3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_embedconfig_livepreview3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_embedconfig_livepreview3(inputs)
	return ar_developerportal_dashboards_tabs_embedconfig_livepreview3(inputs)
});
export { developerportal_dashboards_tabs_embedconfig_livepreview3 as "developerPortal.dashboards.tabs.embedConfig.livePreview" }