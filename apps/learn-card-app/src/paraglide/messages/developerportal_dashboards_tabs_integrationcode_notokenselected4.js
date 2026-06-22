/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Integrationcode_Notokenselected4Inputs */

const en_developerportal_dashboards_tabs_integrationcode_notokenselected4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Notokenselected4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select a token to fill the code below`)
};

const es_developerportal_dashboards_tabs_integrationcode_notokenselected4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Notokenselected4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selecciona un token para completar el código abajo`)
};

const fr_developerportal_dashboards_tabs_integrationcode_notokenselected4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Notokenselected4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionnez un jeton pour remplir le code ci-dessous`)
};

const ar_developerportal_dashboards_tabs_integrationcode_notokenselected4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Notokenselected4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر رمزًا لملء الكود أدناه`)
};

/**
* | output |
* | --- |
* | "Select a token to fill the code below" |
*
* @param {Developerportal_Dashboards_Tabs_Integrationcode_Notokenselected4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_integrationcode_notokenselected4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Integrationcode_Notokenselected4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Integrationcode_Notokenselected4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_integrationcode_notokenselected4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_integrationcode_notokenselected4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_integrationcode_notokenselected4(inputs)
	return ar_developerportal_dashboards_tabs_integrationcode_notokenselected4(inputs)
});
export { developerportal_dashboards_tabs_integrationcode_notokenselected4 as "developerPortal.dashboards.tabs.integrationCode.noTokenSelected" }