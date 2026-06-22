/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Requestidentity_Returns_Desc3Inputs */

const en_developerportal_dashboards_tabs_partnerconnect_methods_requestidentity_returns_desc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Requestidentity_Returns_Desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User identity object with DID and profile`)
};

const es_developerportal_dashboards_tabs_partnerconnect_methods_requestidentity_returns_desc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Requestidentity_Returns_Desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[User identity object with DID and profile]`)
};

const fr_developerportal_dashboards_tabs_partnerconnect_methods_requestidentity_returns_desc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Requestidentity_Returns_Desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[User identity object with DID and profile]`)
};

const ar_developerportal_dashboards_tabs_partnerconnect_methods_requestidentity_returns_desc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Requestidentity_Returns_Desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[User identity object with DID and profile]`)
};

/**
* | output |
* | --- |
* | "User identity object with DID and profile" |
*
* @param {Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Requestidentity_Returns_Desc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_partnerconnect_methods_requestidentity_returns_desc3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Requestidentity_Returns_Desc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Requestidentity_Returns_Desc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_partnerconnect_methods_requestidentity_returns_desc3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_partnerconnect_methods_requestidentity_returns_desc3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_partnerconnect_methods_requestidentity_returns_desc3(inputs)
	return ar_developerportal_dashboards_tabs_partnerconnect_methods_requestidentity_returns_desc3(inputs)
});
export { developerportal_dashboards_tabs_partnerconnect_methods_requestidentity_returns_desc3 as "developerPortal.dashboards.tabs.partnerConnect.methods.requestIdentity.returns.desc" }