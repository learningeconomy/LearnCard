/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Sendcredential_Params_Templatedata_Desc4Inputs */

const en_developerportal_dashboards_tabs_partnerconnect_methods_sendcredential_params_templatedata_desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Sendcredential_Params_Templatedata_Desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Values for template variables (e.g., recipient_name, course_name)`)
};

const es_developerportal_dashboards_tabs_partnerconnect_methods_sendcredential_params_templatedata_desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Sendcredential_Params_Templatedata_Desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Values for template variables (e.g., recipient_name, course_name)]`)
};

const fr_developerportal_dashboards_tabs_partnerconnect_methods_sendcredential_params_templatedata_desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Sendcredential_Params_Templatedata_Desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Values for template variables (e.g., recipient_name, course_name)]`)
};

const ar_developerportal_dashboards_tabs_partnerconnect_methods_sendcredential_params_templatedata_desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Sendcredential_Params_Templatedata_Desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Values for template variables (e.g., recipient_name, course_name)]`)
};

/**
* | output |
* | --- |
* | "Values for template variables (e.g., recipient_name, course_name)" |
*
* @param {Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Sendcredential_Params_Templatedata_Desc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_partnerconnect_methods_sendcredential_params_templatedata_desc4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Sendcredential_Params_Templatedata_Desc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Sendcredential_Params_Templatedata_Desc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_partnerconnect_methods_sendcredential_params_templatedata_desc4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_partnerconnect_methods_sendcredential_params_templatedata_desc4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_partnerconnect_methods_sendcredential_params_templatedata_desc4(inputs)
	return ar_developerportal_dashboards_tabs_partnerconnect_methods_sendcredential_params_templatedata_desc4(inputs)
});
export { developerportal_dashboards_tabs_partnerconnect_methods_sendcredential_params_templatedata_desc4 as "developerPortal.dashboards.tabs.partnerConnect.methods.sendCredential.params.templateData.desc" }