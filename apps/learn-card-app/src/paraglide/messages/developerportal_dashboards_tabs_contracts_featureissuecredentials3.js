/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Contracts_Featureissuecredentials3Inputs */

const en_developerportal_dashboards_tabs_contracts_featureissuecredentials3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Featureissuecredentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue Credentials (Sync Mode)`)
};

const es_developerportal_dashboards_tabs_contracts_featureissuecredentials3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Featureissuecredentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emitir Credenciales (Modo Sincronización)`)
};

const fr_developerportal_dashboards_tabs_contracts_featureissuecredentials3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Featureissuecredentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émettre des Credentials (Mode Synchronisation)`)
};

const ar_developerportal_dashboards_tabs_contracts_featureissuecredentials3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Featureissuecredentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إصدار بيانات الاعتماد (وضع المزامنة)`)
};

/**
* | output |
* | --- |
* | "Issue Credentials (Sync Mode)" |
*
* @param {Developerportal_Dashboards_Tabs_Contracts_Featureissuecredentials3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_contracts_featureissuecredentials3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Contracts_Featureissuecredentials3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Contracts_Featureissuecredentials3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_contracts_featureissuecredentials3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_contracts_featureissuecredentials3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_contracts_featureissuecredentials3(inputs)
	return ar_developerportal_dashboards_tabs_contracts_featureissuecredentials3(inputs)
});
export { developerportal_dashboards_tabs_contracts_featureissuecredentials3 as "developerPortal.dashboards.tabs.contracts.featureIssueCredentials" }