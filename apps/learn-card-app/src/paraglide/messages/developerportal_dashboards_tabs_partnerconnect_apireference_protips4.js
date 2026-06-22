/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Partnerconnect_Apireference_Protips4Inputs */

const en_developerportal_dashboards_tabs_partnerconnect_apireference_protips4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Apireference_Protips4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pro Tips`)
};

const es_developerportal_dashboards_tabs_partnerconnect_apireference_protips4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Apireference_Protips4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consejos Profesionales`)
};

const fr_developerportal_dashboards_tabs_partnerconnect_apireference_protips4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Apireference_Protips4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conseils Pros`)
};

const ar_developerportal_dashboards_tabs_partnerconnect_apireference_protips4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Apireference_Protips4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نصائح احترافية`)
};

/**
* | output |
* | --- |
* | "Pro Tips" |
*
* @param {Developerportal_Dashboards_Tabs_Partnerconnect_Apireference_Protips4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_partnerconnect_apireference_protips4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Partnerconnect_Apireference_Protips4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Partnerconnect_Apireference_Protips4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_partnerconnect_apireference_protips4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_partnerconnect_apireference_protips4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_partnerconnect_apireference_protips4(inputs)
	return ar_developerportal_dashboards_tabs_partnerconnect_apireference_protips4(inputs)
});
export { developerportal_dashboards_tabs_partnerconnect_apireference_protips4 as "developerPortal.dashboards.tabs.partnerConnect.apiReference.proTips" }