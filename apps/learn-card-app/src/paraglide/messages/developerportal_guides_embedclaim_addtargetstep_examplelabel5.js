/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Addtargetstep_Examplelabel5Inputs */

const en_developerportal_guides_embedclaim_addtargetstep_examplelabel5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Addtargetstep_Examplelabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`← Example button`)
};

const es_developerportal_guides_embedclaim_addtargetstep_examplelabel5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Addtargetstep_Examplelabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`← Botón de ejemplo`)
};

const fr_developerportal_guides_embedclaim_addtargetstep_examplelabel5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Addtargetstep_Examplelabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`← Bouton d'exemple`)
};

const ar_developerportal_guides_embedclaim_addtargetstep_examplelabel5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Addtargetstep_Examplelabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`← زر مثال`)
};

/**
* | output |
* | --- |
* | "← Example button" |
*
* @param {Developerportal_Guides_Embedclaim_Addtargetstep_Examplelabel5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_addtargetstep_examplelabel5 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Addtargetstep_Examplelabel5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Addtargetstep_Examplelabel5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_addtargetstep_examplelabel5(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_addtargetstep_examplelabel5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_addtargetstep_examplelabel5(inputs)
	return ar_developerportal_guides_embedclaim_addtargetstep_examplelabel5(inputs)
});
export { developerportal_guides_embedclaim_addtargetstep_examplelabel5 as "developerPortal.guides.embedClaim.addTargetStep.exampleLabel" }