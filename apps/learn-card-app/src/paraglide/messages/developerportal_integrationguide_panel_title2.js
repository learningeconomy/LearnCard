/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Panel_Title2Inputs */

const en_developerportal_integrationguide_panel_title2 = /** @type {(inputs: Developerportal_Integrationguide_Panel_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Integration Guide`)
};

const es_developerportal_integrationguide_panel_title2 = /** @type {(inputs: Developerportal_Integrationguide_Panel_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guía de Integración`)
};

const fr_developerportal_integrationguide_panel_title2 = /** @type {(inputs: Developerportal_Integrationguide_Panel_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guide d'Intégration`)
};

const ar_developerportal_integrationguide_panel_title2 = /** @type {(inputs: Developerportal_Integrationguide_Panel_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`دليل التكامل`)
};

/**
* | output |
* | --- |
* | "Integration Guide" |
*
* @param {Developerportal_Integrationguide_Panel_Title2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_panel_title2 = /** @type {((inputs?: Developerportal_Integrationguide_Panel_Title2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Panel_Title2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_panel_title2(inputs)
	if (locale === "es") return es_developerportal_integrationguide_panel_title2(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_panel_title2(inputs)
	return ar_developerportal_integrationguide_panel_title2(inputs)
});
export { developerportal_integrationguide_panel_title2 as "developerPortal.integrationGuide.panel.title" }