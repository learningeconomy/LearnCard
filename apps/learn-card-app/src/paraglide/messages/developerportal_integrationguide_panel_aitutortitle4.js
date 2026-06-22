/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Panel_Aitutortitle4Inputs */

const en_developerportal_integrationguide_panel_aitutortitle4 = /** @type {(inputs: Developerportal_Integrationguide_Panel_Aitutortitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI Tutor Integration`)
};

const es_developerportal_integrationguide_panel_aitutortitle4 = /** @type {(inputs: Developerportal_Integrationguide_Panel_Aitutortitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Integración de Tutor IA`)
};

const fr_developerportal_integrationguide_panel_aitutortitle4 = /** @type {(inputs: Developerportal_Integrationguide_Panel_Aitutortitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Intégration du Tuteur IA`)
};

const ar_developerportal_integrationguide_panel_aitutortitle4 = /** @type {(inputs: Developerportal_Integrationguide_Panel_Aitutortitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تكامل المعلم الذكي`)
};

/**
* | output |
* | --- |
* | "AI Tutor Integration" |
*
* @param {Developerportal_Integrationguide_Panel_Aitutortitle4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_panel_aitutortitle4 = /** @type {((inputs?: Developerportal_Integrationguide_Panel_Aitutortitle4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Panel_Aitutortitle4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_panel_aitutortitle4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_panel_aitutortitle4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_panel_aitutortitle4(inputs)
	return ar_developerportal_integrationguide_panel_aitutortitle4(inputs)
});
export { developerportal_integrationguide_panel_aitutortitle4 as "developerPortal.integrationGuide.panel.aiTutorTitle" }