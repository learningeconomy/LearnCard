/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ id: NonNullable<unknown> }} Developerportal_Dashboards_Tabs_Testing_Credentialid2Inputs */

const en_developerportal_dashboards_tabs_testing_credentialid2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Credentialid2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`ID: ${i?.id}`)
};

const es_developerportal_dashboards_tabs_testing_credentialid2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Credentialid2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`ID: ${i?.id}`)
};

const fr_developerportal_dashboards_tabs_testing_credentialid2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Credentialid2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`ID : ${i?.id}`)
};

const ar_developerportal_dashboards_tabs_testing_credentialid2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Credentialid2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`المعرف: ${i?.id}`)
};

/**
* | output |
* | --- |
* | "ID: {id}" |
*
* @param {Developerportal_Dashboards_Tabs_Testing_Credentialid2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_testing_credentialid2 = /** @type {((inputs: Developerportal_Dashboards_Tabs_Testing_Credentialid2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Testing_Credentialid2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_testing_credentialid2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_testing_credentialid2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_testing_credentialid2(inputs)
	return ar_developerportal_dashboards_tabs_testing_credentialid2(inputs)
});
export { developerportal_dashboards_tabs_testing_credentialid2 as "developerPortal.dashboards.tabs.testing.credentialId" }