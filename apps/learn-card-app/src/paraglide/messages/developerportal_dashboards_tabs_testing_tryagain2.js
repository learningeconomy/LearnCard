/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Testing_Tryagain2Inputs */

const en_developerportal_dashboards_tabs_testing_tryagain2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Tryagain2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Try Again`)
};

const es_developerportal_dashboards_tabs_testing_tryagain2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Tryagain2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Intentar de Nuevo`)
};

const fr_developerportal_dashboards_tabs_testing_tryagain2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Tryagain2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réessayer`)
};

const ar_developerportal_dashboards_tabs_testing_tryagain2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Tryagain2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حاول مرة أخرى`)
};

/**
* | output |
* | --- |
* | "Try Again" |
*
* @param {Developerportal_Dashboards_Tabs_Testing_Tryagain2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_testing_tryagain2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Testing_Tryagain2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Testing_Tryagain2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_testing_tryagain2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_testing_tryagain2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_testing_tryagain2(inputs)
	return ar_developerportal_dashboards_tabs_testing_tryagain2(inputs)
});
export { developerportal_dashboards_tabs_testing_tryagain2 as "developerPortal.dashboards.tabs.testing.tryAgain" }