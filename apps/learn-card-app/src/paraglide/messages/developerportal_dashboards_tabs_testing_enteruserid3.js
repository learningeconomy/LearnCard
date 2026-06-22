/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Testing_Enteruserid3Inputs */

const en_developerportal_dashboards_tabs_testing_enteruserid3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Enteruserid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please enter a user ID and select a template with a saved boost`)
};

const es_developerportal_dashboards_tabs_testing_enteruserid3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Enteruserid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Por favor ingresa un ID de usuario y selecciona una plantilla con un boost guardado`)
};

const fr_developerportal_dashboards_tabs_testing_enteruserid3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Enteruserid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez entrer un ID utilisateur et sélectionner un modèle avec un boost sauvegardé`)
};

const ar_developerportal_dashboards_tabs_testing_enteruserid3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Enteruserid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يرجى إدخال معرف مستخدم واختيار قالب مع تعزيز محفوظ`)
};

/**
* | output |
* | --- |
* | "Please enter a user ID and select a template with a saved boost" |
*
* @param {Developerportal_Dashboards_Tabs_Testing_Enteruserid3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_testing_enteruserid3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Testing_Enteruserid3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Testing_Enteruserid3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_testing_enteruserid3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_testing_enteruserid3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_testing_enteruserid3(inputs)
	return ar_developerportal_dashboards_tabs_testing_enteruserid3(inputs)
});
export { developerportal_dashboards_tabs_testing_enteruserid3 as "developerPortal.dashboards.tabs.testing.enterUserId" }