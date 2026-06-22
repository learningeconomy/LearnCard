/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Configurestep_Noprojectdesc5Inputs */

const en_developerportal_guides_embedclaim_configurestep_noprojectdesc5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Noprojectdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select or create a project using the dropdown in the header to continue.`)
};

const es_developerportal_guides_embedclaim_configurestep_noprojectdesc5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Noprojectdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selecciona o crea un proyecto usando el menú desplegable en el encabezado para continuar.`)
};

const fr_developerportal_guides_embedclaim_configurestep_noprojectdesc5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Noprojectdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionnez ou créez un projet à l'aide du menu déroulant dans l'en-tête pour continuer.`)
};

const ar_developerportal_guides_embedclaim_configurestep_noprojectdesc5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Noprojectdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر أو أنشئ مشروعاً باستخدام القائمة المنسدلة في الرأس للمتابعة.`)
};

/**
* | output |
* | --- |
* | "Select or create a project using the dropdown in the header to continue." |
*
* @param {Developerportal_Guides_Embedclaim_Configurestep_Noprojectdesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_configurestep_noprojectdesc5 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Configurestep_Noprojectdesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Configurestep_Noprojectdesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_configurestep_noprojectdesc5(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_configurestep_noprojectdesc5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_configurestep_noprojectdesc5(inputs)
	return ar_developerportal_guides_embedclaim_configurestep_noprojectdesc5(inputs)
});
export { developerportal_guides_embedclaim_configurestep_noprojectdesc5 as "developerPortal.guides.embedClaim.configureStep.noProjectDesc" }