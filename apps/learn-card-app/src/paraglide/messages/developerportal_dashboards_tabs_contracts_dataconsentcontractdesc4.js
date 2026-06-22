/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Contracts_Dataconsentcontractdesc4Inputs */

const en_developerportal_dashboards_tabs_contracts_dataconsentcontractdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Dataconsentcontractdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Used to request user consent for data access`)
};

const es_developerportal_dashboards_tabs_contracts_dataconsentcontractdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Dataconsentcontractdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se usa para solicitar el consentimiento del usuario para el acceso a datos`)
};

const fr_developerportal_dashboards_tabs_contracts_dataconsentcontractdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Dataconsentcontractdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utilisé pour demander le consentement de l'utilisateur pour l'accès aux données`)
};

const ar_developerportal_dashboards_tabs_contracts_dataconsentcontractdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Dataconsentcontractdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يستخدم لطلب موافقة المستخدم للوصول إلى البيانات`)
};

/**
* | output |
* | --- |
* | "Used to request user consent for data access" |
*
* @param {Developerportal_Dashboards_Tabs_Contracts_Dataconsentcontractdesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_contracts_dataconsentcontractdesc4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Contracts_Dataconsentcontractdesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Contracts_Dataconsentcontractdesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_contracts_dataconsentcontractdesc4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_contracts_dataconsentcontractdesc4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_contracts_dataconsentcontractdesc4(inputs)
	return ar_developerportal_dashboards_tabs_contracts_dataconsentcontractdesc4(inputs)
});
export { developerportal_dashboards_tabs_contracts_dataconsentcontractdesc4 as "developerPortal.dashboards.tabs.contracts.dataConsentContractDesc" }