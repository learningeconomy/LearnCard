/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Requestconsent_Params_Contracturi_Desc4Inputs */

const en_developerportal_dashboards_tabs_partnerconnect_methods_requestconsent_params_contracturi_desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Requestconsent_Params_Contracturi_Desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`The URI of the consent contract`)
};

const es_developerportal_dashboards_tabs_partnerconnect_methods_requestconsent_params_contracturi_desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Requestconsent_Params_Contracturi_Desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[The URI of the consent contract]`)
};

const fr_developerportal_dashboards_tabs_partnerconnect_methods_requestconsent_params_contracturi_desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Requestconsent_Params_Contracturi_Desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[The URI of the consent contract]`)
};

const ar_developerportal_dashboards_tabs_partnerconnect_methods_requestconsent_params_contracturi_desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Requestconsent_Params_Contracturi_Desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[The URI of the consent contract]`)
};

/**
* | output |
* | --- |
* | "The URI of the consent contract" |
*
* @param {Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Requestconsent_Params_Contracturi_Desc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_partnerconnect_methods_requestconsent_params_contracturi_desc4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Requestconsent_Params_Contracturi_Desc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Requestconsent_Params_Contracturi_Desc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_partnerconnect_methods_requestconsent_params_contracturi_desc4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_partnerconnect_methods_requestconsent_params_contracturi_desc4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_partnerconnect_methods_requestconsent_params_contracturi_desc4(inputs)
	return ar_developerportal_dashboards_tabs_partnerconnect_methods_requestconsent_params_contracturi_desc4(inputs)
});
export { developerportal_dashboards_tabs_partnerconnect_methods_requestconsent_params_contracturi_desc4 as "developerPortal.dashboards.tabs.partnerConnect.methods.requestConsent.params.contractUri.desc" }