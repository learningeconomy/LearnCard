/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Contracts_Howtoaddstep34Inputs */

const en_developerportal_dashboards_tabs_contracts_howtoaddstep34 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Howtoaddstep34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configure a ConsentFlow contract`)
};

const es_developerportal_dashboards_tabs_contracts_howtoaddstep34 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Howtoaddstep34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configura un contrato de ConsentFlow`)
};

const fr_developerportal_dashboards_tabs_contracts_howtoaddstep34 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Howtoaddstep34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurez un contrat ConsentFlow`)
};

const ar_developerportal_dashboards_tabs_contracts_howtoaddstep34 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Howtoaddstep34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم بتكوين عقد تدفق الموافقة`)
};

/**
* | output |
* | --- |
* | "Configure a ConsentFlow contract" |
*
* @param {Developerportal_Dashboards_Tabs_Contracts_Howtoaddstep34Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_contracts_howtoaddstep34 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Contracts_Howtoaddstep34Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Contracts_Howtoaddstep34Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_contracts_howtoaddstep34(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_contracts_howtoaddstep34(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_contracts_howtoaddstep34(inputs)
	return ar_developerportal_dashboards_tabs_contracts_howtoaddstep34(inputs)
});
export { developerportal_dashboards_tabs_contracts_howtoaddstep34 as "developerPortal.dashboards.tabs.contracts.howToAddStep3" }