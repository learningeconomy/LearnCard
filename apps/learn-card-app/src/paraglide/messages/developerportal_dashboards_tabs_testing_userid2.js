/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Testing_Userid2Inputs */

const en_developerportal_dashboards_tabs_testing_userid2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Userid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User ID`)
};

const es_developerportal_dashboards_tabs_testing_userid2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Userid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID de Usuario`)
};

const fr_developerportal_dashboards_tabs_testing_userid2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Userid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID Utilisateur`)
};

const ar_developerportal_dashboards_tabs_testing_userid2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Userid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معرف المستخدم`)
};

/**
* | output |
* | --- |
* | "User ID" |
*
* @param {Developerportal_Dashboards_Tabs_Testing_Userid2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_testing_userid2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Testing_Userid2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Testing_Userid2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_testing_userid2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_testing_userid2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_testing_userid2(inputs)
	return ar_developerportal_dashboards_tabs_testing_userid2(inputs)
});
export { developerportal_dashboards_tabs_testing_userid2 as "developerPortal.dashboards.tabs.testing.userId" }