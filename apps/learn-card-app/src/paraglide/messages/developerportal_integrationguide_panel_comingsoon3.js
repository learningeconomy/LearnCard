/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Panel_Comingsoon3Inputs */

const en_developerportal_integrationguide_panel_comingsoon3 = /** @type {(inputs: Developerportal_Integrationguide_Panel_Comingsoon3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Integration guide coming soon for this launch type.`)
};

const es_developerportal_integrationguide_panel_comingsoon3 = /** @type {(inputs: Developerportal_Integrationguide_Panel_Comingsoon3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guía de integración próximamente para este tipo de lanzamiento.`)
};

const fr_developerportal_integrationguide_panel_comingsoon3 = /** @type {(inputs: Developerportal_Integrationguide_Panel_Comingsoon3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guide d'intégration bientôt disponible pour ce type de lancement.`)
};

const ar_developerportal_integrationguide_panel_comingsoon3 = /** @type {(inputs: Developerportal_Integrationguide_Panel_Comingsoon3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`دليل التكامل قريباً لنوع الإطلاق هذا.`)
};

/**
* | output |
* | --- |
* | "Integration guide coming soon for this launch type." |
*
* @param {Developerportal_Integrationguide_Panel_Comingsoon3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_panel_comingsoon3 = /** @type {((inputs?: Developerportal_Integrationguide_Panel_Comingsoon3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Panel_Comingsoon3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_panel_comingsoon3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_panel_comingsoon3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_panel_comingsoon3(inputs)
	return ar_developerportal_integrationguide_panel_comingsoon3(inputs)
});
export { developerportal_integrationguide_panel_comingsoon3 as "developerPortal.integrationGuide.panel.comingSoon" }