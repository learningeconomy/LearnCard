/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Branding_Cardcolorsdesc3Inputs */

const en_developerportal_dashboards_tabs_branding_cardcolorsdesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Cardcolorsdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Customize your contact card appearance`)
};

const es_developerportal_dashboards_tabs_branding_cardcolorsdesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Cardcolorsdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personaliza la apariencia de tu tarjeta de contacto`)
};

const fr_developerportal_dashboards_tabs_branding_cardcolorsdesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Cardcolorsdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personnalisez l'apparence de votre carte de contact`)
};

const ar_developerportal_dashboards_tabs_branding_cardcolorsdesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Cardcolorsdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تخصيص مظهر بطاقة الاتصال الخاصة بك`)
};

/**
* | output |
* | --- |
* | "Customize your contact card appearance" |
*
* @param {Developerportal_Dashboards_Tabs_Branding_Cardcolorsdesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_branding_cardcolorsdesc3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Branding_Cardcolorsdesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Branding_Cardcolorsdesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_branding_cardcolorsdesc3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_branding_cardcolorsdesc3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_branding_cardcolorsdesc3(inputs)
	return ar_developerportal_dashboards_tabs_branding_cardcolorsdesc3(inputs)
});
export { developerportal_dashboards_tabs_branding_cardcolorsdesc3 as "developerPortal.dashboards.tabs.branding.cardColorsDesc" }