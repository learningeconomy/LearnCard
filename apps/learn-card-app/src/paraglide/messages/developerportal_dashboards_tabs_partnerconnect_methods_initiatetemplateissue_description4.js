/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Initiatetemplateissue_Description4Inputs */

const en_developerportal_dashboards_tabs_partnerconnect_methods_initiatetemplateissue_description4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Initiatetemplateissue_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue a credential using a pre-defined boost template. Templates are configured in the LearnCard dashboard and ensure consistent credential formatting. Best for recurring credential types.`)
};

const es_developerportal_dashboards_tabs_partnerconnect_methods_initiatetemplateissue_description4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Initiatetemplateissue_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Issue a credential using a pre-defined boost template. Templates are configured in the LearnCard dashboard and ensure consistent credential formatting. Best for recurring credential types.]`)
};

const fr_developerportal_dashboards_tabs_partnerconnect_methods_initiatetemplateissue_description4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Initiatetemplateissue_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Issue a credential using a pre-defined boost template. Templates are configured in the LearnCard dashboard and ensure consistent credential formatting. Best for recurring credential types.]`)
};

const ar_developerportal_dashboards_tabs_partnerconnect_methods_initiatetemplateissue_description4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Initiatetemplateissue_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Issue a credential using a pre-defined boost template. Templates are configured in the LearnCard dashboard and ensure consistent credential formatting. Best for recurring credential types.]`)
};

/**
* | output |
* | --- |
* | "Issue a credential using a pre-defined boost template. Templates are configured in the LearnCard dashboard and ensure consistent credential formatting. Best ..." |
*
* @param {Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Initiatetemplateissue_Description4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_partnerconnect_methods_initiatetemplateissue_description4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Initiatetemplateissue_Description4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Initiatetemplateissue_Description4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_partnerconnect_methods_initiatetemplateissue_description4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_partnerconnect_methods_initiatetemplateissue_description4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_partnerconnect_methods_initiatetemplateissue_description4(inputs)
	return ar_developerportal_dashboards_tabs_partnerconnect_methods_initiatetemplateissue_description4(inputs)
});
export { developerportal_dashboards_tabs_partnerconnect_methods_initiatetemplateissue_description4 as "developerPortal.dashboards.tabs.partnerConnect.methods.initiateTemplateIssue.description" }