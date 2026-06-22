/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Askcredentialsearch_Returns_Desc4Inputs */

const en_developerportal_dashboards_tabs_partnerconnect_methods_askcredentialsearch_returns_desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Askcredentialsearch_Returns_Desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Array of credentials the user chose to share`)
};

const es_developerportal_dashboards_tabs_partnerconnect_methods_askcredentialsearch_returns_desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Askcredentialsearch_Returns_Desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Array of credentials the user chose to share]`)
};

const fr_developerportal_dashboards_tabs_partnerconnect_methods_askcredentialsearch_returns_desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Askcredentialsearch_Returns_Desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Array of credentials the user chose to share]`)
};

const ar_developerportal_dashboards_tabs_partnerconnect_methods_askcredentialsearch_returns_desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Askcredentialsearch_Returns_Desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Array of credentials the user chose to share]`)
};

/**
* | output |
* | --- |
* | "Array of credentials the user chose to share" |
*
* @param {Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Askcredentialsearch_Returns_Desc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_partnerconnect_methods_askcredentialsearch_returns_desc4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Askcredentialsearch_Returns_Desc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Askcredentialsearch_Returns_Desc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_partnerconnect_methods_askcredentialsearch_returns_desc4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_partnerconnect_methods_askcredentialsearch_returns_desc4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_partnerconnect_methods_askcredentialsearch_returns_desc4(inputs)
	return ar_developerportal_dashboards_tabs_partnerconnect_methods_askcredentialsearch_returns_desc4(inputs)
});
export { developerportal_dashboards_tabs_partnerconnect_methods_askcredentialsearch_returns_desc4 as "developerPortal.dashboards.tabs.partnerConnect.methods.askCredentialSearch.returns.desc" }