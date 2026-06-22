/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Branding_Cardbackgroundimage3Inputs */

const en_developerportal_dashboards_tabs_branding_cardbackgroundimage3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Cardbackgroundimage3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Card Background`)
};

const es_developerportal_dashboards_tabs_branding_cardbackgroundimage3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Cardbackgroundimage3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fondo de Tarjeta`)
};

const fr_developerportal_dashboards_tabs_branding_cardbackgroundimage3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Cardbackgroundimage3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fond de Carte`)
};

const ar_developerportal_dashboards_tabs_branding_cardbackgroundimage3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Cardbackgroundimage3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خلفية البطاقة`)
};

/**
* | output |
* | --- |
* | "Card Background" |
*
* @param {Developerportal_Dashboards_Tabs_Branding_Cardbackgroundimage3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_branding_cardbackgroundimage3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Branding_Cardbackgroundimage3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Branding_Cardbackgroundimage3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_branding_cardbackgroundimage3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_branding_cardbackgroundimage3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_branding_cardbackgroundimage3(inputs)
	return ar_developerportal_dashboards_tabs_branding_cardbackgroundimage3(inputs)
});
export { developerportal_dashboards_tabs_branding_cardbackgroundimage3 as "developerPortal.dashboards.tabs.branding.cardBackgroundImage" }