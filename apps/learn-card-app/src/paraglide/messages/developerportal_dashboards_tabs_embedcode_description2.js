/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Embedcode_Description2Inputs */

const en_developerportal_dashboards_tabs_embedcode_description2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedcode_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy and paste into your website to add a claim button`)
};

const es_developerportal_dashboards_tabs_embedcode_description2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedcode_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copia y pega en tu sitio web para agregar un botón de reclamo`)
};

const fr_developerportal_dashboards_tabs_embedcode_description2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedcode_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copiez et collez dans votre site web pour ajouter un bouton de réclamation`)
};

const ar_developerportal_dashboards_tabs_embedcode_description2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedcode_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`انسخ والصق في موقع الويب الخاص بك لإضافة زر المطالبة`)
};

/**
* | output |
* | --- |
* | "Copy and paste into your website to add a claim button" |
*
* @param {Developerportal_Dashboards_Tabs_Embedcode_Description2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_embedcode_description2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Embedcode_Description2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Embedcode_Description2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_embedcode_description2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_embedcode_description2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_embedcode_description2(inputs)
	return ar_developerportal_dashboards_tabs_embedcode_description2(inputs)
});
export { developerportal_dashboards_tabs_embedcode_description2 as "developerPortal.dashboards.tabs.embedCode.description" }