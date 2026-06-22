/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Partnerconnect_Apireference_Parameters3Inputs */

const en_developerportal_dashboards_tabs_partnerconnect_apireference_parameters3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Apireference_Parameters3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Parameters`)
};

const es_developerportal_dashboards_tabs_partnerconnect_apireference_parameters3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Apireference_Parameters3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Parámetros`)
};

const fr_developerportal_dashboards_tabs_partnerconnect_apireference_parameters3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Apireference_Parameters3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Paramètres`)
};

const ar_developerportal_dashboards_tabs_partnerconnect_apireference_parameters3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Apireference_Parameters3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المعلمات`)
};

/**
* | output |
* | --- |
* | "Parameters" |
*
* @param {Developerportal_Dashboards_Tabs_Partnerconnect_Apireference_Parameters3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_partnerconnect_apireference_parameters3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Partnerconnect_Apireference_Parameters3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Partnerconnect_Apireference_Parameters3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_partnerconnect_apireference_parameters3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_partnerconnect_apireference_parameters3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_partnerconnect_apireference_parameters3(inputs)
	return ar_developerportal_dashboards_tabs_partnerconnect_apireference_parameters3(inputs)
});
export { developerportal_dashboards_tabs_partnerconnect_apireference_parameters3 as "developerPortal.dashboards.tabs.partnerConnect.apiReference.parameters" }