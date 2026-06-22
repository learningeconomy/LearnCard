/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Testing_Useridplaceholder3Inputs */

const en_developerportal_dashboards_tabs_testing_useridplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Useridplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`profileId or did:...`)
};

const es_developerportal_dashboards_tabs_testing_useridplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Useridplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`profileId o did:...`)
};

const fr_developerportal_dashboards_tabs_testing_useridplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Useridplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`profileId ou did:...`)
};

const ar_developerportal_dashboards_tabs_testing_useridplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Useridplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معرف الملف الشخصي أو did:...`)
};

/**
* | output |
* | --- |
* | "profileId or did:..." |
*
* @param {Developerportal_Dashboards_Tabs_Testing_Useridplaceholder3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_testing_useridplaceholder3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Testing_Useridplaceholder3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Testing_Useridplaceholder3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_testing_useridplaceholder3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_testing_useridplaceholder3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_testing_useridplaceholder3(inputs)
	return ar_developerportal_dashboards_tabs_testing_useridplaceholder3(inputs)
});
export { developerportal_dashboards_tabs_testing_useridplaceholder3 as "developerPortal.dashboards.tabs.testing.userIdPlaceholder" }