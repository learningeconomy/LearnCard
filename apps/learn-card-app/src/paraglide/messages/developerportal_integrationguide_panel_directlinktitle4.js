/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Panel_Directlinktitle4Inputs */

const en_developerportal_integrationguide_panel_directlinktitle4 = /** @type {(inputs: Developerportal_Integrationguide_Panel_Directlinktitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Direct Link Integration`)
};

const es_developerportal_integrationguide_panel_directlinktitle4 = /** @type {(inputs: Developerportal_Integrationguide_Panel_Directlinktitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Integración de Enlace Directo`)
};

const fr_developerportal_integrationguide_panel_directlinktitle4 = /** @type {(inputs: Developerportal_Integrationguide_Panel_Directlinktitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Intégration par Lien Direct`)
};

const ar_developerportal_integrationguide_panel_directlinktitle4 = /** @type {(inputs: Developerportal_Integrationguide_Panel_Directlinktitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تكامل الرابط المباشر`)
};

/**
* | output |
* | --- |
* | "Direct Link Integration" |
*
* @param {Developerportal_Integrationguide_Panel_Directlinktitle4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_panel_directlinktitle4 = /** @type {((inputs?: Developerportal_Integrationguide_Panel_Directlinktitle4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Panel_Directlinktitle4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_panel_directlinktitle4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_panel_directlinktitle4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_panel_directlinktitle4(inputs)
	return ar_developerportal_integrationguide_panel_directlinktitle4(inputs)
});
export { developerportal_integrationguide_panel_directlinktitle4 as "developerPortal.integrationGuide.panel.directLinkTitle" }