/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Contracts_Credentialissuancecontractdesc4Inputs */

const en_developerportal_dashboards_tabs_contracts_credentialissuancecontractdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Credentialissuancecontractdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Used to sync credentials to user wallets via consent`)
};

const es_developerportal_dashboards_tabs_contracts_credentialissuancecontractdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Credentialissuancecontractdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se usa para sincronizar credenciales a las billeteras de los usuarios mediante consentimiento`)
};

const fr_developerportal_dashboards_tabs_contracts_credentialissuancecontractdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Credentialissuancecontractdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utilisé pour synchroniser les credentials vers les portefeuilles des utilisateurs via consentement`)
};

const ar_developerportal_dashboards_tabs_contracts_credentialissuancecontractdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Credentialissuancecontractdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يستخدم لمزامنة بيانات الاعتماد إلى محافظ المستخدمين عبر الموافقة`)
};

/**
* | output |
* | --- |
* | "Used to sync credentials to user wallets via consent" |
*
* @param {Developerportal_Dashboards_Tabs_Contracts_Credentialissuancecontractdesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_contracts_credentialissuancecontractdesc4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Contracts_Credentialissuancecontractdesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Contracts_Credentialissuancecontractdesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_contracts_credentialissuancecontractdesc4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_contracts_credentialissuancecontractdesc4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_contracts_credentialissuancecontractdesc4(inputs)
	return ar_developerportal_dashboards_tabs_contracts_credentialissuancecontractdesc4(inputs)
});
export { developerportal_dashboards_tabs_contracts_credentialissuancecontractdesc4 as "developerPortal.dashboards.tabs.contracts.credentialIssuanceContractDesc" }