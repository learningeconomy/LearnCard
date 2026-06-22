/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Requestconsent_Shortdesc4Inputs */

const en_developerportal_dashboards_tabs_partnerconnect_methods_requestconsent_shortdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Requestconsent_Shortdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request permissions`)
};

const es_developerportal_dashboards_tabs_partnerconnect_methods_requestconsent_shortdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Requestconsent_Shortdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Request permissions]`)
};

const fr_developerportal_dashboards_tabs_partnerconnect_methods_requestconsent_shortdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Requestconsent_Shortdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Request permissions]`)
};

const ar_developerportal_dashboards_tabs_partnerconnect_methods_requestconsent_shortdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Requestconsent_Shortdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Request permissions]`)
};

/**
* | output |
* | --- |
* | "Request permissions" |
*
* @param {Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Requestconsent_Shortdesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_partnerconnect_methods_requestconsent_shortdesc4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Requestconsent_Shortdesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Requestconsent_Shortdesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_partnerconnect_methods_requestconsent_shortdesc4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_partnerconnect_methods_requestconsent_shortdesc4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_partnerconnect_methods_requestconsent_shortdesc4(inputs)
	return ar_developerportal_dashboards_tabs_partnerconnect_methods_requestconsent_shortdesc4(inputs)
});
export { developerportal_dashboards_tabs_partnerconnect_methods_requestconsent_shortdesc4 as "developerPortal.dashboards.tabs.partnerConnect.methods.requestConsent.shortDesc" }