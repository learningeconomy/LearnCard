/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowtesting_Tipconnections4Inputs */

const en_developerportal_dashboards_tabs_consentflowtesting_tipconnections4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Tipconnections4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Check the Connections tab after testing to verify the consent was recorded`)
};

const es_developerportal_dashboards_tabs_consentflowtesting_tipconnections4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Tipconnections4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revisa la pestaña Conexiones después de probar para verificar que el consentimiento se registró`)
};

const fr_developerportal_dashboards_tabs_consentflowtesting_tipconnections4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Tipconnections4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifiez l'onglet Connexions après le test pour confirmer que le consentement a été enregistré`)
};

const ar_developerportal_dashboards_tabs_consentflowtesting_tipconnections4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Tipconnections4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحقق من علامة تبويب الاتصالات بعد الاختبار للتحقق من تسجيل الموافقة`)
};

/**
* | output |
* | --- |
* | "Check the Connections tab after testing to verify the consent was recorded" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowtesting_Tipconnections4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowtesting_tipconnections4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowtesting_Tipconnections4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowtesting_Tipconnections4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowtesting_tipconnections4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowtesting_tipconnections4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowtesting_tipconnections4(inputs)
	return ar_developerportal_dashboards_tabs_consentflowtesting_tipconnections4(inputs)
});
export { developerportal_dashboards_tabs_consentflowtesting_tipconnections4 as "developerPortal.dashboards.tabs.consentFlowTesting.tipConnections" }