/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Contracts_Nocontracts2Inputs */

const en_developerportal_dashboards_tabs_contracts_nocontracts2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Nocontracts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No contracts configured`)
};

const es_developerportal_dashboards_tabs_contracts_nocontracts2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Nocontracts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No hay contratos configurados`)
};

const fr_developerportal_dashboards_tabs_contracts_nocontracts2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Nocontracts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun contrat configuré`)
};

const ar_developerportal_dashboards_tabs_contracts_nocontracts2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Nocontracts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد عقود مهيأة`)
};

/**
* | output |
* | --- |
* | "No contracts configured" |
*
* @param {Developerportal_Dashboards_Tabs_Contracts_Nocontracts2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_contracts_nocontracts2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Contracts_Nocontracts2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Contracts_Nocontracts2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_contracts_nocontracts2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_contracts_nocontracts2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_contracts_nocontracts2(inputs)
	return ar_developerportal_dashboards_tabs_contracts_nocontracts2(inputs)
});
export { developerportal_dashboards_tabs_contracts_nocontracts2 as "developerPortal.dashboards.tabs.contracts.noContracts" }