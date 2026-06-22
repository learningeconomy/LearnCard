/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Testing_Sendanother2Inputs */

const en_developerportal_dashboards_tabs_testing_sendanother2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Sendanother2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send Another`)
};

const es_developerportal_dashboards_tabs_testing_sendanother2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Sendanother2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviar Otra`)
};

const fr_developerportal_dashboards_tabs_testing_sendanother2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Sendanother2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyer un Autre`)
};

const ar_developerportal_dashboards_tabs_testing_sendanother2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Sendanother2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إرسال آخر`)
};

/**
* | output |
* | --- |
* | "Send Another" |
*
* @param {Developerportal_Dashboards_Tabs_Testing_Sendanother2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_testing_sendanother2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Testing_Sendanother2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Testing_Sendanother2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_testing_sendanother2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_testing_sendanother2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_testing_sendanother2(inputs)
	return ar_developerportal_dashboards_tabs_testing_sendanother2(inputs)
});
export { developerportal_dashboards_tabs_testing_sendanother2 as "developerPortal.dashboards.tabs.testing.sendAnother" }