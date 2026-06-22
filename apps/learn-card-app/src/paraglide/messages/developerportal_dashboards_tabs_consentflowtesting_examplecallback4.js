/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowtesting_Examplecallback4Inputs */

const en_developerportal_dashboards_tabs_consentflowtesting_examplecallback4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Examplecallback4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Example callback your server receives`)
};

const es_developerportal_dashboards_tabs_consentflowtesting_examplecallback4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Examplecallback4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ejemplo de callback que recibe tu servidor`)
};

const fr_developerportal_dashboards_tabs_consentflowtesting_examplecallback4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Examplecallback4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Exemple de callback que votre serveur reçoit`)
};

const ar_developerportal_dashboards_tabs_consentflowtesting_examplecallback4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Examplecallback4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مثال على الاستدعاء الذي يستلمه خادمك`)
};

/**
* | output |
* | --- |
* | "Example callback your server receives" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowtesting_Examplecallback4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowtesting_examplecallback4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowtesting_Examplecallback4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowtesting_Examplecallback4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowtesting_examplecallback4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowtesting_examplecallback4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowtesting_examplecallback4(inputs)
	return ar_developerportal_dashboards_tabs_consentflowtesting_examplecallback4(inputs)
});
export { developerportal_dashboards_tabs_consentflowtesting_examplecallback4 as "developerPortal.dashboards.tabs.consentFlowTesting.exampleCallback" }