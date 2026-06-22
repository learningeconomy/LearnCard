/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Contracts_Consentflowcontractdesc4Inputs */

const en_developerportal_dashboards_tabs_contracts_consentflowcontractdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Consentflowcontractdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Used for consent redirect flow`)
};

const es_developerportal_dashboards_tabs_contracts_consentflowcontractdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Consentflowcontractdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se usa para el flujo de redirección de consentimiento`)
};

const fr_developerportal_dashboards_tabs_contracts_consentflowcontractdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Consentflowcontractdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utilisé pour le flux de redirection de consentement`)
};

const ar_developerportal_dashboards_tabs_contracts_consentflowcontractdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Consentflowcontractdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يستخدم لتدفق إعادة توجيه الموافقة`)
};

/**
* | output |
* | --- |
* | "Used for consent redirect flow" |
*
* @param {Developerportal_Dashboards_Tabs_Contracts_Consentflowcontractdesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_contracts_consentflowcontractdesc4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Contracts_Consentflowcontractdesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Contracts_Consentflowcontractdesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_contracts_consentflowcontractdesc4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_contracts_consentflowcontractdesc4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_contracts_consentflowcontractdesc4(inputs)
	return ar_developerportal_dashboards_tabs_contracts_consentflowcontractdesc4(inputs)
});
export { developerportal_dashboards_tabs_contracts_consentflowcontractdesc4 as "developerPortal.dashboards.tabs.contracts.consentFlowContractDesc" }