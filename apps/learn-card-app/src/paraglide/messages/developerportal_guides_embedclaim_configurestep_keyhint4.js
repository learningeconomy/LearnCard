/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Configurestep_Keyhint4Inputs */

const en_developerportal_guides_embedclaim_configurestep_keyhint4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Keyhint4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Change your project using the dropdown in the header.`)
};

const es_developerportal_guides_embedclaim_configurestep_keyhint4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Keyhint4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cambia tu proyecto usando el menú desplegable en el encabezado.`)
};

const fr_developerportal_guides_embedclaim_configurestep_keyhint4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Keyhint4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Changez de projet à l'aide du menu déroulant dans l'en-tête.`)
};

const ar_developerportal_guides_embedclaim_configurestep_keyhint4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Keyhint4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`غير مشروعك باستخدام القائمة المنسدلة في الرأس.`)
};

/**
* | output |
* | --- |
* | "Change your project using the dropdown in the header." |
*
* @param {Developerportal_Guides_Embedclaim_Configurestep_Keyhint4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_configurestep_keyhint4 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Configurestep_Keyhint4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Configurestep_Keyhint4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_configurestep_keyhint4(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_configurestep_keyhint4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_configurestep_keyhint4(inputs)
	return ar_developerportal_guides_embedclaim_configurestep_keyhint4(inputs)
});
export { developerportal_guides_embedclaim_configurestep_keyhint4 as "developerPortal.guides.embedClaim.configureStep.keyHint" }