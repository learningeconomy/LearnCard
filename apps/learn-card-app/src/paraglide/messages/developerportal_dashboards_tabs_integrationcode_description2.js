/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Integrationcode_Description2Inputs */

const en_developerportal_dashboards_tabs_integrationcode_description2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy boost URIs and generate integration code`)
};

const es_developerportal_dashboards_tabs_integrationcode_description2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copia los URI de Boost y genera código de integración`)
};

const fr_developerportal_dashboards_tabs_integrationcode_description2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copiez les URI Boost et générez du code d'intégration`)
};

const ar_developerportal_dashboards_tabs_integrationcode_description2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`انسخ روابط Boost وأنشئ كود التكامل`)
};

/**
* | output |
* | --- |
* | "Copy boost URIs and generate integration code" |
*
* @param {Developerportal_Dashboards_Tabs_Integrationcode_Description2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_integrationcode_description2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Integrationcode_Description2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Integrationcode_Description2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_integrationcode_description2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_integrationcode_description2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_integrationcode_description2(inputs)
	return ar_developerportal_dashboards_tabs_integrationcode_description2(inputs)
});
export { developerportal_dashboards_tabs_integrationcode_description2 as "developerPortal.dashboards.tabs.integrationCode.description" }