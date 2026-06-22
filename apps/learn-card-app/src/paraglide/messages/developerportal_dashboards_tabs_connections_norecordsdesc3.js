/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Connections_Norecordsdesc3Inputs */

const en_developerportal_dashboards_tabs_connections_norecordsdesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Norecordsdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Users who grant consent via your redirect flow will appear here. Try the consent flow from the Testing tab first.`)
};

const es_developerportal_dashboards_tabs_connections_norecordsdesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Norecordsdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Los usuarios que otorguen consentimiento a través de tu flujo de redirección aparecerán aquí. Prueba el flujo de consentimiento desde la pestaña de Pruebas primero.`)
};

const fr_developerportal_dashboards_tabs_connections_norecordsdesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Norecordsdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les utilisateurs qui accordent leur consentement via votre flux de redirection apparaîtront ici. Essayez d'abord le flux de consentement depuis l'onglet Test.`)
};

const ar_developerportal_dashboards_tabs_connections_norecordsdesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Norecordsdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سيظهر المستخدمون الذين يمنحون الموافقة عبر تدفق إعادة التوجيه الخاص بك هنا. جرب تدفق الموافقة من علامة تبويب الاختبار أولاً.`)
};

/**
* | output |
* | --- |
* | "Users who grant consent via your redirect flow will appear here. Try the consent flow from the Testing tab first." |
*
* @param {Developerportal_Dashboards_Tabs_Connections_Norecordsdesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_connections_norecordsdesc3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Connections_Norecordsdesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Connections_Norecordsdesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_connections_norecordsdesc3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_connections_norecordsdesc3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_connections_norecordsdesc3(inputs)
	return ar_developerportal_dashboards_tabs_connections_norecordsdesc3(inputs)
});
export { developerportal_dashboards_tabs_connections_norecordsdesc3 as "developerPortal.dashboards.tabs.connections.noRecordsDesc" }