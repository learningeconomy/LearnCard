/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Connections_Nocontractdesc3Inputs */

const en_developerportal_dashboards_tabs_connections_nocontractdesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Nocontractdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Complete the Build guide to create a consent flow contract first. Consent records will appear here once users start granting consent.`)
};

const es_developerportal_dashboards_tabs_connections_nocontractdesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Nocontractdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Completa la guía de Build para crear primero un contrato de flujo de consentimiento. Los registros de consentimiento aparecerán aquí una vez que los usuarios comiencen a otorgar consentimiento.`)
};

const fr_developerportal_dashboards_tabs_connections_nocontractdesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Nocontractdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Complétez le guide Build pour créer d'abord un contrat de flux de consentement. Les enregistrements de consentement apparaîtront ici une fois que les utilisateurs commenceront à donner leur consentement.`)
};

const ar_developerportal_dashboards_tabs_connections_nocontractdesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Nocontractdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أكمل دليل البناء لإنشاء عقد تدفق الموافقة أولاً. ستظهر سجلات الموافقة هنا بمجرد أن يبدأ المستخدمون في منح الموافقة.`)
};

/**
* | output |
* | --- |
* | "Complete the Build guide to create a consent flow contract first. Consent records will appear here once users start granting consent." |
*
* @param {Developerportal_Dashboards_Tabs_Connections_Nocontractdesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_connections_nocontractdesc3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Connections_Nocontractdesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Connections_Nocontractdesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_connections_nocontractdesc3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_connections_nocontractdesc3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_connections_nocontractdesc3(inputs)
	return ar_developerportal_dashboards_tabs_connections_nocontractdesc3(inputs)
});
export { developerportal_dashboards_tabs_connections_nocontractdesc3 as "developerPortal.dashboards.tabs.connections.noContractDesc" }