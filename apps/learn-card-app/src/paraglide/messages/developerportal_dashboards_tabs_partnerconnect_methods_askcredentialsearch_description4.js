/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Askcredentialsearch_Description4Inputs */

const en_developerportal_dashboards_tabs_partnerconnect_methods_askcredentialsearch_description4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Askcredentialsearch_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request access to search the user's credential wallet. The user will see a consent prompt and can choose which credentials to share. Great for verification flows or importing existing credentials.`)
};

const es_developerportal_dashboards_tabs_partnerconnect_methods_askcredentialsearch_description4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Askcredentialsearch_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Request access to search the user's credential wallet. The user will see a consent prompt and can choose which credentials to share. Great for verification flows or importing existing credentials.]`)
};

const fr_developerportal_dashboards_tabs_partnerconnect_methods_askcredentialsearch_description4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Askcredentialsearch_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Request access to search the user's credential wallet. The user will see a consent prompt and can choose which credentials to share. Great for verification flows or importing existing credentials.]`)
};

const ar_developerportal_dashboards_tabs_partnerconnect_methods_askcredentialsearch_description4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Askcredentialsearch_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Request access to search the user's credential wallet. The user will see a consent prompt and can choose which credentials to share. Great for verification flows or importing existing credentials.]`)
};

/**
* | output |
* | --- |
* | "Request access to search the user's credential wallet. The user will see a consent prompt and can choose which credentials to share. Great for verification f..." |
*
* @param {Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Askcredentialsearch_Description4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_partnerconnect_methods_askcredentialsearch_description4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Askcredentialsearch_Description4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Askcredentialsearch_Description4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_partnerconnect_methods_askcredentialsearch_description4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_partnerconnect_methods_askcredentialsearch_description4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_partnerconnect_methods_askcredentialsearch_description4(inputs)
	return ar_developerportal_dashboards_tabs_partnerconnect_methods_askcredentialsearch_description4(inputs)
});
export { developerportal_dashboards_tabs_partnerconnect_methods_askcredentialsearch_description4 as "developerPortal.dashboards.tabs.partnerConnect.methods.askCredentialSearch.description" }