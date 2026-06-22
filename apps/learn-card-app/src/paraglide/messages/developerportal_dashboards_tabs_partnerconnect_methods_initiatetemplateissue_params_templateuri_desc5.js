/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Initiatetemplateissue_Params_Templateuri_Desc5Inputs */

const en_developerportal_dashboards_tabs_partnerconnect_methods_initiatetemplateissue_params_templateuri_desc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Initiatetemplateissue_Params_Templateuri_Desc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`The URI of the boost/template to issue from`)
};

const es_developerportal_dashboards_tabs_partnerconnect_methods_initiatetemplateissue_params_templateuri_desc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Initiatetemplateissue_Params_Templateuri_Desc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[The URI of the boost/template to issue from]`)
};

const fr_developerportal_dashboards_tabs_partnerconnect_methods_initiatetemplateissue_params_templateuri_desc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Initiatetemplateissue_Params_Templateuri_Desc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[The URI of the boost/template to issue from]`)
};

const ar_developerportal_dashboards_tabs_partnerconnect_methods_initiatetemplateissue_params_templateuri_desc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Initiatetemplateissue_Params_Templateuri_Desc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[The URI of the boost/template to issue from]`)
};

/**
* | output |
* | --- |
* | "The URI of the boost/template to issue from" |
*
* @param {Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Initiatetemplateissue_Params_Templateuri_Desc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_partnerconnect_methods_initiatetemplateissue_params_templateuri_desc5 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Initiatetemplateissue_Params_Templateuri_Desc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Initiatetemplateissue_Params_Templateuri_Desc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_partnerconnect_methods_initiatetemplateissue_params_templateuri_desc5(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_partnerconnect_methods_initiatetemplateissue_params_templateuri_desc5(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_partnerconnect_methods_initiatetemplateissue_params_templateuri_desc5(inputs)
	return ar_developerportal_dashboards_tabs_partnerconnect_methods_initiatetemplateissue_params_templateuri_desc5(inputs)
});
export { developerportal_dashboards_tabs_partnerconnect_methods_initiatetemplateissue_params_templateuri_desc5 as "developerPortal.dashboards.tabs.partnerConnect.methods.initiateTemplateIssue.params.templateUri.desc" }