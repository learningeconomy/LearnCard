/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Configurestep_Logopreviewalt5Inputs */

const en_developerportal_guides_embedclaim_configurestep_logopreviewalt5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Logopreviewalt5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Logo preview`)
};

const es_developerportal_guides_embedclaim_configurestep_logopreviewalt5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Logopreviewalt5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vista previa del logotipo`)
};

const fr_developerportal_guides_embedclaim_configurestep_logopreviewalt5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Logopreviewalt5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aperçu du logo`)
};

const ar_developerportal_guides_embedclaim_configurestep_logopreviewalt5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Logopreviewalt5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معاينة الشعار`)
};

/**
* | output |
* | --- |
* | "Logo preview" |
*
* @param {Developerportal_Guides_Embedclaim_Configurestep_Logopreviewalt5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_configurestep_logopreviewalt5 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Configurestep_Logopreviewalt5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Configurestep_Logopreviewalt5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_configurestep_logopreviewalt5(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_configurestep_logopreviewalt5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_configurestep_logopreviewalt5(inputs)
	return ar_developerportal_guides_embedclaim_configurestep_logopreviewalt5(inputs)
});
export { developerportal_guides_embedclaim_configurestep_logopreviewalt5 as "developerPortal.guides.embedClaim.configureStep.logoPreviewAlt" }