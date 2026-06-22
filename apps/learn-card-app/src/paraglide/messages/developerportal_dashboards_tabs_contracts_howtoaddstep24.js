/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Contracts_Howtoaddstep24Inputs */

const en_developerportal_dashboards_tabs_contracts_howtoaddstep24 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Howtoaddstep24Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select "Request Data Consent" feature`)
};

const es_developerportal_dashboards_tabs_contracts_howtoaddstep24 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Howtoaddstep24Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selecciona la función "Solicitar Consentimiento de Datos"`)
};

const fr_developerportal_dashboards_tabs_contracts_howtoaddstep24 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Howtoaddstep24Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionnez la fonctionnalité "Demander le Consentement de Données"`)
};

const ar_developerportal_dashboards_tabs_contracts_howtoaddstep24 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Howtoaddstep24Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر ميزة "طلب موافقة البيانات"`)
};

/**
* | output |
* | --- |
* | "Select \"Request Data Consent\" feature" |
*
* @param {Developerportal_Dashboards_Tabs_Contracts_Howtoaddstep24Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_contracts_howtoaddstep24 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Contracts_Howtoaddstep24Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Contracts_Howtoaddstep24Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_contracts_howtoaddstep24(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_contracts_howtoaddstep24(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_contracts_howtoaddstep24(inputs)
	return ar_developerportal_dashboards_tabs_contracts_howtoaddstep24(inputs)
});
export { developerportal_dashboards_tabs_contracts_howtoaddstep24 as "developerPortal.dashboards.tabs.contracts.howToAddStep2" }