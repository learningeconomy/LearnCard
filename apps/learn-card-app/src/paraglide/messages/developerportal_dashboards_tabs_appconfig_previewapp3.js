/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Appconfig_Previewapp3Inputs */

const en_developerportal_dashboards_tabs_appconfig_previewapp3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Previewapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preview App`)
};

const es_developerportal_dashboards_tabs_appconfig_previewapp3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Previewapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vista previa`)
};

const fr_developerportal_dashboards_tabs_appconfig_previewapp3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Previewapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aperçu`)
};

const ar_developerportal_dashboards_tabs_appconfig_previewapp3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Previewapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معاينة التطبيق`)
};

/**
* | output |
* | --- |
* | "Preview App" |
*
* @param {Developerportal_Dashboards_Tabs_Appconfig_Previewapp3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_appconfig_previewapp3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Appconfig_Previewapp3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Appconfig_Previewapp3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_appconfig_previewapp3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_appconfig_previewapp3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_appconfig_previewapp3(inputs)
	return ar_developerportal_dashboards_tabs_appconfig_previewapp3(inputs)
});
export { developerportal_dashboards_tabs_appconfig_previewapp3 as "developerPortal.dashboards.tabs.appConfig.previewApp" }