/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Steps_Addtarget3Inputs */

const en_developerportal_guides_embedclaim_steps_addtarget3 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Steps_Addtarget3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add HTML Target`)
};

const es_developerportal_guides_embedclaim_steps_addtarget3 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Steps_Addtarget3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir Destino HTML`)
};

const fr_developerportal_guides_embedclaim_steps_addtarget3 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Steps_Addtarget3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter une Cible HTML`)
};

const ar_developerportal_guides_embedclaim_steps_addtarget3 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Steps_Addtarget3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة هدف HTML`)
};

/**
* | output |
* | --- |
* | "Add HTML Target" |
*
* @param {Developerportal_Guides_Embedclaim_Steps_Addtarget3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_steps_addtarget3 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Steps_Addtarget3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Steps_Addtarget3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_steps_addtarget3(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_steps_addtarget3(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_steps_addtarget3(inputs)
	return ar_developerportal_guides_embedclaim_steps_addtarget3(inputs)
});
export { developerportal_guides_embedclaim_steps_addtarget3 as "developerPortal.guides.embedClaim.steps.addTarget" }