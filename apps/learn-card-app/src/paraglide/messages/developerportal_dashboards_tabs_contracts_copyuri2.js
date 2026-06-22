/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Contracts_Copyuri2Inputs */

const en_developerportal_dashboards_tabs_contracts_copyuri2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Copyuri2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy URI`)
};

const es_developerportal_dashboards_tabs_contracts_copyuri2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Copyuri2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copiar URI`)
};

const fr_developerportal_dashboards_tabs_contracts_copyuri2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Copyuri2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copier l'URI`)
};

const ar_developerportal_dashboards_tabs_contracts_copyuri2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Copyuri2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نسخ الرابط`)
};

/**
* | output |
* | --- |
* | "Copy URI" |
*
* @param {Developerportal_Dashboards_Tabs_Contracts_Copyuri2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_contracts_copyuri2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Contracts_Copyuri2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Contracts_Copyuri2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_contracts_copyuri2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_contracts_copyuri2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_contracts_copyuri2(inputs)
	return ar_developerportal_dashboards_tabs_contracts_copyuri2(inputs)
});
export { developerportal_dashboards_tabs_contracts_copyuri2 as "developerPortal.dashboards.tabs.contracts.copyUri" }