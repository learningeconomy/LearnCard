/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Partnerconnect_Resources_Githubexamples3Inputs */

const en_developerportal_dashboards_tabs_partnerconnect_resources_githubexamples3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Resources_Githubexamples3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`GitHub Examples`)
};

const es_developerportal_dashboards_tabs_partnerconnect_resources_githubexamples3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Resources_Githubexamples3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ejemplos de GitHub`)
};

const fr_developerportal_dashboards_tabs_partnerconnect_resources_githubexamples3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Resources_Githubexamples3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Exemples GitHub`)
};

const ar_developerportal_dashboards_tabs_partnerconnect_resources_githubexamples3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Resources_Githubexamples3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أمثلة GitHub`)
};

/**
* | output |
* | --- |
* | "GitHub Examples" |
*
* @param {Developerportal_Dashboards_Tabs_Partnerconnect_Resources_Githubexamples3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_partnerconnect_resources_githubexamples3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Partnerconnect_Resources_Githubexamples3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Partnerconnect_Resources_Githubexamples3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_partnerconnect_resources_githubexamples3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_partnerconnect_resources_githubexamples3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_partnerconnect_resources_githubexamples3(inputs)
	return ar_developerportal_dashboards_tabs_partnerconnect_resources_githubexamples3(inputs)
});
export { developerportal_dashboards_tabs_partnerconnect_resources_githubexamples3 as "developerPortal.dashboards.tabs.partnerConnect.resources.githubExamples" }