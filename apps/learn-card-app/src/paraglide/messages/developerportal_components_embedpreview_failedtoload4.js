/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Embedpreview_Failedtoload4Inputs */

const en_developerportal_components_embedpreview_failedtoload4 = /** @type {(inputs: Developerportal_Components_Embedpreview_Failedtoload4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to load embed SDK`)
};

const es_developerportal_components_embedpreview_failedtoload4 = /** @type {(inputs: Developerportal_Components_Embedpreview_Failedtoload4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al cargar el SDK de embed`)
};

const fr_developerportal_components_embedpreview_failedtoload4 = /** @type {(inputs: Developerportal_Components_Embedpreview_Failedtoload4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec du chargement du SDK d'intégration`)
};

const ar_developerportal_components_embedpreview_failedtoload4 = /** @type {(inputs: Developerportal_Components_Embedpreview_Failedtoload4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل تحميل SDK التضمين`)
};

/**
* | output |
* | --- |
* | "Failed to load embed SDK" |
*
* @param {Developerportal_Components_Embedpreview_Failedtoload4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_embedpreview_failedtoload4 = /** @type {((inputs?: Developerportal_Components_Embedpreview_Failedtoload4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Embedpreview_Failedtoload4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_embedpreview_failedtoload4(inputs)
	if (locale === "es") return es_developerportal_components_embedpreview_failedtoload4(inputs)
	if (locale === "fr") return fr_developerportal_components_embedpreview_failedtoload4(inputs)
	return ar_developerportal_components_embedpreview_failedtoload4(inputs)
});
export { developerportal_components_embedpreview_failedtoload4 as "developerPortal.components.embedPreview.failedToLoad" }