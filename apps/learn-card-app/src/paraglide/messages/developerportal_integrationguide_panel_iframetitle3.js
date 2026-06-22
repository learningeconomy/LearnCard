/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Panel_Iframetitle3Inputs */

const en_developerportal_integrationguide_panel_iframetitle3 = /** @type {(inputs: Developerportal_Integrationguide_Panel_Iframetitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Embedded Iframe Integration`)
};

const es_developerportal_integrationguide_panel_iframetitle3 = /** @type {(inputs: Developerportal_Integrationguide_Panel_Iframetitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Integración de Iframe Incrustado`)
};

const fr_developerportal_integrationguide_panel_iframetitle3 = /** @type {(inputs: Developerportal_Integrationguide_Panel_Iframetitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Intégration par Iframe Intégré`)
};

const ar_developerportal_integrationguide_panel_iframetitle3 = /** @type {(inputs: Developerportal_Integrationguide_Panel_Iframetitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تكامل الإطار المضمن`)
};

/**
* | output |
* | --- |
* | "Embedded Iframe Integration" |
*
* @param {Developerportal_Integrationguide_Panel_Iframetitle3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_panel_iframetitle3 = /** @type {((inputs?: Developerportal_Integrationguide_Panel_Iframetitle3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Panel_Iframetitle3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_panel_iframetitle3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_panel_iframetitle3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_panel_iframetitle3(inputs)
	return ar_developerportal_integrationguide_panel_iframetitle3(inputs)
});
export { developerportal_integrationguide_panel_iframetitle3 as "developerPortal.integrationGuide.panel.iframeTitle" }