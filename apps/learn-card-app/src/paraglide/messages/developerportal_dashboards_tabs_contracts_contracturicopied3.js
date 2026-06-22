/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Contracts_Contracturicopied3Inputs */

const en_developerportal_dashboards_tabs_contracts_contracturicopied3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Contracturicopied3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contract URI copied!`)
};

const es_developerportal_dashboards_tabs_contracts_contracturicopied3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Contracturicopied3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡URI del contrato copiada!`)
};

const fr_developerportal_dashboards_tabs_contracts_contracturicopied3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Contracturicopied3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URI du contrat copiée !`)
};

const ar_developerportal_dashboards_tabs_contracts_contracturicopied3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Contracturicopied3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم نسخ رابط العقد!`)
};

/**
* | output |
* | --- |
* | "Contract URI copied!" |
*
* @param {Developerportal_Dashboards_Tabs_Contracts_Contracturicopied3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_contracts_contracturicopied3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Contracts_Contracturicopied3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Contracts_Contracturicopied3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_contracts_contracturicopied3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_contracts_contracturicopied3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_contracts_contracturicopied3(inputs)
	return ar_developerportal_dashboards_tabs_contracts_contracturicopied3(inputs)
});
export { developerportal_dashboards_tabs_contracts_contracturicopied3 as "developerPortal.dashboards.tabs.contracts.contractUriCopied" }