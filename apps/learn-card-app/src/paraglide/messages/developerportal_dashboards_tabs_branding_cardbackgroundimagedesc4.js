/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Branding_Cardbackgroundimagedesc4Inputs */

const en_developerportal_dashboards_tabs_branding_cardbackgroundimagedesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Cardbackgroundimagedesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Optional background image for your card`)
};

const es_developerportal_dashboards_tabs_branding_cardbackgroundimagedesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Cardbackgroundimagedesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Imagen de fondo opcional para tu tarjeta`)
};

const fr_developerportal_dashboards_tabs_branding_cardbackgroundimagedesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Cardbackgroundimagedesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Image de fond optionnelle pour votre carte`)
};

const ar_developerportal_dashboards_tabs_branding_cardbackgroundimagedesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Cardbackgroundimagedesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صورة خلفية اختيارية لبطاقتك`)
};

/**
* | output |
* | --- |
* | "Optional background image for your card" |
*
* @param {Developerportal_Dashboards_Tabs_Branding_Cardbackgroundimagedesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_branding_cardbackgroundimagedesc4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Branding_Cardbackgroundimagedesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Branding_Cardbackgroundimagedesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_branding_cardbackgroundimagedesc4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_branding_cardbackgroundimagedesc4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_branding_cardbackgroundimagedesc4(inputs)
	return ar_developerportal_dashboards_tabs_branding_cardbackgroundimagedesc4(inputs)
});
export { developerportal_dashboards_tabs_branding_cardbackgroundimagedesc4 as "developerPortal.dashboards.tabs.branding.cardBackgroundImageDesc" }