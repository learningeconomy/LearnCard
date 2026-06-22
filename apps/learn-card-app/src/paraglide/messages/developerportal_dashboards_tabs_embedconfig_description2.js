/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Embedconfig_Description2Inputs */

const en_developerportal_dashboards_tabs_embedconfig_description2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configure branding, preview, and domain settings for your embed`)
};

const es_developerportal_dashboards_tabs_embedconfig_description2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configura la marca, vista previa y dominios para tu embed`)
};

const fr_developerportal_dashboards_tabs_embedconfig_description2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurez la marque, l'aperçu et les domaines pour votre embed`)
};

const ar_developerportal_dashboards_tabs_embedconfig_description2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تكوين العلامة التجارية والمعاينة والمجالات للتضمين الخاص بك`)
};

/**
* | output |
* | --- |
* | "Configure branding, preview, and domain settings for your embed" |
*
* @param {Developerportal_Dashboards_Tabs_Embedconfig_Description2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_embedconfig_description2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Embedconfig_Description2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Embedconfig_Description2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_embedconfig_description2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_embedconfig_description2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_embedconfig_description2(inputs)
	return ar_developerportal_dashboards_tabs_embedconfig_description2(inputs)
});
export { developerportal_dashboards_tabs_embedconfig_description2 as "developerPortal.dashboards.tabs.embedConfig.description" }