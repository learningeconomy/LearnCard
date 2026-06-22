/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Requestidentity_Shortdesc4Inputs */

const en_developerportal_dashboards_tabs_partnerconnect_methods_requestidentity_shortdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Requestidentity_Shortdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`SSO authentication`)
};

const es_developerportal_dashboards_tabs_partnerconnect_methods_requestidentity_shortdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Requestidentity_Shortdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[SSO authentication]`)
};

const fr_developerportal_dashboards_tabs_partnerconnect_methods_requestidentity_shortdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Requestidentity_Shortdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[SSO authentication]`)
};

const ar_developerportal_dashboards_tabs_partnerconnect_methods_requestidentity_shortdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Requestidentity_Shortdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[SSO authentication]`)
};

/**
* | output |
* | --- |
* | "SSO authentication" |
*
* @param {Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Requestidentity_Shortdesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_partnerconnect_methods_requestidentity_shortdesc4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Requestidentity_Shortdesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Requestidentity_Shortdesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_partnerconnect_methods_requestidentity_shortdesc4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_partnerconnect_methods_requestidentity_shortdesc4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_partnerconnect_methods_requestidentity_shortdesc4(inputs)
	return ar_developerportal_dashboards_tabs_partnerconnect_methods_requestidentity_shortdesc4(inputs)
});
export { developerportal_dashboards_tabs_partnerconnect_methods_requestidentity_shortdesc4 as "developerPortal.dashboards.tabs.partnerConnect.methods.requestIdentity.shortDesc" }