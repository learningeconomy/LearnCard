/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Testing_Enteremailoruserid5Inputs */

const en_developerportal_dashboards_tabs_testing_enteremailoruserid5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Enteremailoruserid5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please enter an email or user ID and select a template with a saved boost`)
};

const es_developerportal_dashboards_tabs_testing_enteremailoruserid5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Enteremailoruserid5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Por favor ingresa un correo o ID de usuario y selecciona una plantilla con un boost guardado`)
};

const fr_developerportal_dashboards_tabs_testing_enteremailoruserid5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Enteremailoruserid5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez entrer un email ou un ID utilisateur et sélectionner un modèle avec un boost sauvegardé`)
};

const ar_developerportal_dashboards_tabs_testing_enteremailoruserid5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Enteremailoruserid5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يرجى إدخال بريد إلكتروني أو معرف مستخدم واختيار قالب مع تعزيز محفوظ`)
};

/**
* | output |
* | --- |
* | "Please enter an email or user ID and select a template with a saved boost" |
*
* @param {Developerportal_Dashboards_Tabs_Testing_Enteremailoruserid5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_testing_enteremailoruserid5 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Testing_Enteremailoruserid5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Testing_Enteremailoruserid5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_testing_enteremailoruserid5(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_testing_enteremailoruserid5(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_testing_enteremailoruserid5(inputs)
	return ar_developerportal_dashboards_tabs_testing_enteremailoruserid5(inputs)
});
export { developerportal_dashboards_tabs_testing_enteremailoruserid5 as "developerPortal.dashboards.tabs.testing.enterEmailOrUserId" }