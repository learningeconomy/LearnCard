/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Embedconfig_Previewtemplate3Inputs */

const en_developerportal_dashboards_tabs_embedconfig_previewtemplate3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Previewtemplate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preview Template`)
};

const es_developerportal_dashboards_tabs_embedconfig_previewtemplate3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Previewtemplate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Plantilla de Vista Previa`)
};

const fr_developerportal_dashboards_tabs_embedconfig_previewtemplate3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Previewtemplate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modèle d'Aperçu`)
};

const ar_developerportal_dashboards_tabs_embedconfig_previewtemplate3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Previewtemplate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قالب المعاينة`)
};

/**
* | output |
* | --- |
* | "Preview Template" |
*
* @param {Developerportal_Dashboards_Tabs_Embedconfig_Previewtemplate3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_embedconfig_previewtemplate3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Embedconfig_Previewtemplate3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Embedconfig_Previewtemplate3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_embedconfig_previewtemplate3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_embedconfig_previewtemplate3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_embedconfig_previewtemplate3(inputs)
	return ar_developerportal_dashboards_tabs_embedconfig_previewtemplate3(inputs)
});
export { developerportal_dashboards_tabs_embedconfig_previewtemplate3 as "developerPortal.dashboards.tabs.embedConfig.previewTemplate" }