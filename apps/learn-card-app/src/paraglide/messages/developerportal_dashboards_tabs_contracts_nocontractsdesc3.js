/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Contracts_Nocontractsdesc3Inputs */

const en_developerportal_dashboards_tabs_contracts_nocontractsdesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Nocontractsdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contracts are configured when you enable features like "Request Data Consent" or "Issue Credentials (Sync Mode)" in the setup wizard.`)
};

const es_developerportal_dashboards_tabs_contracts_nocontractsdesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Nocontractsdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Los contratos se configuran cuando habilitas funciones como "Solicitar Consentimiento de Datos" o "Emitir Credenciales (Modo Sincronización)" en el asistente de configuración.`)
};

const fr_developerportal_dashboards_tabs_contracts_nocontractsdesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Nocontractsdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les contrats sont configurés lorsque vous activez des fonctionnalités comme "Demander le Consentement de Données" ou "Émettre des Credentials (Mode Synchronisation)" dans l'assistant de configuration.`)
};

const ar_developerportal_dashboards_tabs_contracts_nocontractsdesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Nocontractsdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يتم تكوين العقود عند تمكين ميزات مثل "طلب موافقة البيانات" أو "إصدار بيانات الاعتماد (وضع المزامنة)" في معالج الإعداد.`)
};

/**
* | output |
* | --- |
* | "Contracts are configured when you enable features like \"Request Data Consent\" or \"Issue Credentials (Sync Mode)\" in the setup wizard." |
*
* @param {Developerportal_Dashboards_Tabs_Contracts_Nocontractsdesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_contracts_nocontractsdesc3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Contracts_Nocontractsdesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Contracts_Nocontractsdesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_contracts_nocontractsdesc3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_contracts_nocontractsdesc3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_contracts_nocontractsdesc3(inputs)
	return ar_developerportal_dashboards_tabs_contracts_nocontractsdesc3(inputs)
});
export { developerportal_dashboards_tabs_contracts_nocontractsdesc3 as "developerPortal.dashboards.tabs.contracts.noContractsDesc" }