/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Testing_Enteremail2Inputs */

const en_developerportal_dashboards_tabs_testing_enteremail2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Enteremail2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please enter an email and select a template with a saved boost`)
};

const es_developerportal_dashboards_tabs_testing_enteremail2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Enteremail2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Por favor ingresa un correo y selecciona una plantilla con un boost guardado`)
};

const fr_developerportal_dashboards_tabs_testing_enteremail2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Enteremail2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez entrer un email et sélectionner un modèle avec un boost sauvegardé`)
};

const ar_developerportal_dashboards_tabs_testing_enteremail2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Enteremail2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يرجى إدخال بريد إلكتروني واختيار قالب مع تعزيز محفوظ`)
};

/**
* | output |
* | --- |
* | "Please enter an email and select a template with a saved boost" |
*
* @param {Developerportal_Dashboards_Tabs_Testing_Enteremail2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_testing_enteremail2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Testing_Enteremail2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Testing_Enteremail2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_testing_enteremail2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_testing_enteremail2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_testing_enteremail2(inputs)
	return ar_developerportal_dashboards_tabs_testing_enteremail2(inputs)
});
export { developerportal_dashboards_tabs_testing_enteremail2 as "developerPortal.dashboards.tabs.testing.enterEmail" }