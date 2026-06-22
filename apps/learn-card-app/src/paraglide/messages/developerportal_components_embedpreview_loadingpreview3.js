/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Embedpreview_Loadingpreview3Inputs */

const en_developerportal_components_embedpreview_loadingpreview3 = /** @type {(inputs: Developerportal_Components_Embedpreview_Loadingpreview3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading preview...`)
};

const es_developerportal_components_embedpreview_loadingpreview3 = /** @type {(inputs: Developerportal_Components_Embedpreview_Loadingpreview3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando vista previa...`)
};

const fr_developerportal_components_embedpreview_loadingpreview3 = /** @type {(inputs: Developerportal_Components_Embedpreview_Loadingpreview3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement de l'aperçu...`)
};

const ar_developerportal_components_embedpreview_loadingpreview3 = /** @type {(inputs: Developerportal_Components_Embedpreview_Loadingpreview3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري تحميل المعاينة...`)
};

/**
* | output |
* | --- |
* | "Loading preview..." |
*
* @param {Developerportal_Components_Embedpreview_Loadingpreview3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_embedpreview_loadingpreview3 = /** @type {((inputs?: Developerportal_Components_Embedpreview_Loadingpreview3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Embedpreview_Loadingpreview3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_embedpreview_loadingpreview3(inputs)
	if (locale === "es") return es_developerportal_components_embedpreview_loadingpreview3(inputs)
	if (locale === "fr") return fr_developerportal_components_embedpreview_loadingpreview3(inputs)
	return ar_developerportal_components_embedpreview_loadingpreview3(inputs)
});
export { developerportal_components_embedpreview_loadingpreview3 as "developerPortal.components.embedPreview.loadingPreview" }