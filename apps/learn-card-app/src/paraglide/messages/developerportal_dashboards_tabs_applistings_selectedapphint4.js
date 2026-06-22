/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Applistings_Selectedapphint4Inputs */

const en_developerportal_dashboards_tabs_applistings_selectedapphint4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Selectedapphint4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use the Partner Connect tab to get integration code for this app.`)
};

const es_developerportal_dashboards_tabs_applistings_selectedapphint4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Selectedapphint4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Usa la pestaña Partner Connect para obtener el código de integración para esta app.`)
};

const fr_developerportal_dashboards_tabs_applistings_selectedapphint4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Selectedapphint4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utilisez l'onglet Partner Connect pour obtenir le code d'intégration pour cette application.`)
};

const ar_developerportal_dashboards_tabs_applistings_selectedapphint4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Selectedapphint4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استخدم علامة تبويب Partner Connect للحصول على كود التكامل لهذا التطبيق.`)
};

/**
* | output |
* | --- |
* | "Use the Partner Connect tab to get integration code for this app." |
*
* @param {Developerportal_Dashboards_Tabs_Applistings_Selectedapphint4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_applistings_selectedapphint4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Applistings_Selectedapphint4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Applistings_Selectedapphint4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_applistings_selectedapphint4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_applistings_selectedapphint4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_applistings_selectedapphint4(inputs)
	return ar_developerportal_dashboards_tabs_applistings_selectedapphint4(inputs)
});
export { developerportal_dashboards_tabs_applistings_selectedapphint4 as "developerPortal.dashboards.tabs.appListings.selectedAppHint" }