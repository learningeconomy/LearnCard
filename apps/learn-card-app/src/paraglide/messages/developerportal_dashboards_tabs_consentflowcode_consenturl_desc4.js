/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowcode_Consenturl_Desc4Inputs */

const en_developerportal_dashboards_tabs_consentflowcode_consenturl_desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Consenturl_Desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`The URL to redirect users to for granting consent`)
};

const es_developerportal_dashboards_tabs_consentflowcode_consenturl_desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Consenturl_Desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La URL para redirigir a los usuarios para otorgar consentimiento`)
};

const fr_developerportal_dashboards_tabs_consentflowcode_consenturl_desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Consenturl_Desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`L'URL vers laquelle rediriger les utilisateurs pour donner leur consentement`)
};

const ar_developerportal_dashboards_tabs_consentflowcode_consenturl_desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Consenturl_Desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الرابط لإعادة توجيه المستخدمين لمنح الموافقة`)
};

/**
* | output |
* | --- |
* | "The URL to redirect users to for granting consent" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowcode_Consenturl_Desc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowcode_consenturl_desc4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowcode_Consenturl_Desc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowcode_Consenturl_Desc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowcode_consenturl_desc4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowcode_consenturl_desc4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowcode_consenturl_desc4(inputs)
	return ar_developerportal_dashboards_tabs_consentflowcode_consenturl_desc4(inputs)
});
export { developerportal_dashboards_tabs_consentflowcode_consenturl_desc4 as "developerPortal.dashboards.tabs.consentFlowCode.consentUrl.desc" }