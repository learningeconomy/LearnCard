/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Branding_Imagerecommended2Inputs */

const en_developerportal_dashboards_tabs_branding_imagerecommended2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Imagerecommended2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recommended: Square image, at least 256x256px`)
};

const es_developerportal_dashboards_tabs_branding_imagerecommended2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Imagerecommended2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recomendado: Imagen cuadrada, al menos 256x256px`)
};

const fr_developerportal_dashboards_tabs_branding_imagerecommended2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Imagerecommended2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recommandé : Image carrée, au moins 256x256px`)
};

const ar_developerportal_dashboards_tabs_branding_imagerecommended2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Imagerecommended2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`موصى به: صورة مربعة، 256x256 بكسل على الأقل`)
};

/**
* | output |
* | --- |
* | "Recommended: Square image, at least 256x256px" |
*
* @param {Developerportal_Dashboards_Tabs_Branding_Imagerecommended2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_branding_imagerecommended2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Branding_Imagerecommended2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Branding_Imagerecommended2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_branding_imagerecommended2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_branding_imagerecommended2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_branding_imagerecommended2(inputs)
	return ar_developerportal_dashboards_tabs_branding_imagerecommended2(inputs)
});
export { developerportal_dashboards_tabs_branding_imagerecommended2 as "developerPortal.dashboards.tabs.branding.imageRecommended" }