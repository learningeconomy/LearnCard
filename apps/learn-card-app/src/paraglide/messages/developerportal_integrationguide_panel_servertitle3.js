/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Panel_Servertitle3Inputs */

const en_developerportal_integrationguide_panel_servertitle3 = /** @type {(inputs: Developerportal_Integrationguide_Panel_Servertitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Server Headless Integration`)
};

const es_developerportal_integrationguide_panel_servertitle3 = /** @type {(inputs: Developerportal_Integrationguide_Panel_Servertitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Integración Headless de Servidor`)
};

const fr_developerportal_integrationguide_panel_servertitle3 = /** @type {(inputs: Developerportal_Integrationguide_Panel_Servertitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Intégration Headless Serveur`)
};

const ar_developerportal_integrationguide_panel_servertitle3 = /** @type {(inputs: Developerportal_Integrationguide_Panel_Servertitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تكامل الخادم بدون واجهة`)
};

/**
* | output |
* | --- |
* | "Server Headless Integration" |
*
* @param {Developerportal_Integrationguide_Panel_Servertitle3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_panel_servertitle3 = /** @type {((inputs?: Developerportal_Integrationguide_Panel_Servertitle3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Panel_Servertitle3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_panel_servertitle3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_panel_servertitle3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_panel_servertitle3(inputs)
	return ar_developerportal_integrationguide_panel_servertitle3(inputs)
});
export { developerportal_integrationguide_panel_servertitle3 as "developerPortal.integrationGuide.panel.serverTitle" }