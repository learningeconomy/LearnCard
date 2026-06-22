/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Partnerconnect_Resources_Sdkdocs3Inputs */

const en_developerportal_dashboards_tabs_partnerconnect_resources_sdkdocs3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Resources_Sdkdocs3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`SDK Documentation`)
};

const es_developerportal_dashboards_tabs_partnerconnect_resources_sdkdocs3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Resources_Sdkdocs3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Documentación del SDK`)
};

const fr_developerportal_dashboards_tabs_partnerconnect_resources_sdkdocs3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Resources_Sdkdocs3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Documentation du SDK`)
};

const ar_developerportal_dashboards_tabs_partnerconnect_resources_sdkdocs3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Resources_Sdkdocs3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`توثيق SDK`)
};

/**
* | output |
* | --- |
* | "SDK Documentation" |
*
* @param {Developerportal_Dashboards_Tabs_Partnerconnect_Resources_Sdkdocs3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_partnerconnect_resources_sdkdocs3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Partnerconnect_Resources_Sdkdocs3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Partnerconnect_Resources_Sdkdocs3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_partnerconnect_resources_sdkdocs3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_partnerconnect_resources_sdkdocs3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_partnerconnect_resources_sdkdocs3(inputs)
	return ar_developerportal_dashboards_tabs_partnerconnect_resources_sdkdocs3(inputs)
});
export { developerportal_dashboards_tabs_partnerconnect_resources_sdkdocs3 as "developerPortal.dashboards.tabs.partnerConnect.resources.sdkDocs" }