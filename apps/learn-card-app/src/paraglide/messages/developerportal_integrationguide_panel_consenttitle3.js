/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Panel_Consenttitle3Inputs */

const en_developerportal_integrationguide_panel_consenttitle3 = /** @type {(inputs: Developerportal_Integrationguide_Panel_Consenttitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consent Flow Integration`)
};

const es_developerportal_integrationguide_panel_consenttitle3 = /** @type {(inputs: Developerportal_Integrationguide_Panel_Consenttitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Integración de Flujo de Consentimiento`)
};

const fr_developerportal_integrationguide_panel_consenttitle3 = /** @type {(inputs: Developerportal_Integrationguide_Panel_Consenttitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Intégration par Flux de Consentement`)
};

const ar_developerportal_integrationguide_panel_consenttitle3 = /** @type {(inputs: Developerportal_Integrationguide_Panel_Consenttitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تكامل تدفق الموافقة`)
};

/**
* | output |
* | --- |
* | "Consent Flow Integration" |
*
* @param {Developerportal_Integrationguide_Panel_Consenttitle3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_panel_consenttitle3 = /** @type {((inputs?: Developerportal_Integrationguide_Panel_Consenttitle3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Panel_Consenttitle3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_panel_consenttitle3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_panel_consenttitle3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_panel_consenttitle3(inputs)
	return ar_developerportal_integrationguide_panel_consenttitle3(inputs)
});
export { developerportal_integrationguide_panel_consenttitle3 as "developerPortal.integrationGuide.panel.consentTitle" }