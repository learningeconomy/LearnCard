/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Contracts_Howtoaddstep14Inputs */

const en_developerportal_dashboards_tabs_contracts_howtoaddstep14 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Howtoaddstep14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Go to the Integration Hub`)
};

const es_developerportal_dashboards_tabs_contracts_howtoaddstep14 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Howtoaddstep14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ve al Hub de Integración`)
};

const fr_developerportal_dashboards_tabs_contracts_howtoaddstep14 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Howtoaddstep14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Allez dans le Hub d'Intégration`)
};

const ar_developerportal_dashboards_tabs_contracts_howtoaddstep14 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Howtoaddstep14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اذهب إلى مركز التكامل`)
};

/**
* | output |
* | --- |
* | "Go to the Integration Hub" |
*
* @param {Developerportal_Dashboards_Tabs_Contracts_Howtoaddstep14Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_contracts_howtoaddstep14 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Contracts_Howtoaddstep14Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Contracts_Howtoaddstep14Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_contracts_howtoaddstep14(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_contracts_howtoaddstep14(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_contracts_howtoaddstep14(inputs)
	return ar_developerportal_dashboards_tabs_contracts_howtoaddstep14(inputs)
});
export { developerportal_dashboards_tabs_contracts_howtoaddstep14 as "developerPortal.dashboards.tabs.contracts.howToAddStep1" }