/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Panel_Subtitle2Inputs */

const en_developerportal_integrationguide_panel_subtitle2 = /** @type {(inputs: Developerportal_Integrationguide_Panel_Subtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Step-by-step developer guide`)
};

const es_developerportal_integrationguide_panel_subtitle2 = /** @type {(inputs: Developerportal_Integrationguide_Panel_Subtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guía para desarrolladores paso a paso`)
};

const fr_developerportal_integrationguide_panel_subtitle2 = /** @type {(inputs: Developerportal_Integrationguide_Panel_Subtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guide développeur étape par étape`)
};

const ar_developerportal_integrationguide_panel_subtitle2 = /** @type {(inputs: Developerportal_Integrationguide_Panel_Subtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`دليل المطور خطوة بخطوة`)
};

/**
* | output |
* | --- |
* | "Step-by-step developer guide" |
*
* @param {Developerportal_Integrationguide_Panel_Subtitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_panel_subtitle2 = /** @type {((inputs?: Developerportal_Integrationguide_Panel_Subtitle2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Panel_Subtitle2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_panel_subtitle2(inputs)
	if (locale === "es") return es_developerportal_integrationguide_panel_subtitle2(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_panel_subtitle2(inputs)
	return ar_developerportal_integrationguide_panel_subtitle2(inputs)
});
export { developerportal_integrationguide_panel_subtitle2 as "developerPortal.integrationGuide.panel.subtitle" }