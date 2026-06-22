/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Configurestep_Partnernamehint5Inputs */

const en_developerportal_guides_embedclaim_configurestep_partnernamehint5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Partnernamehint5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Shown alongside your logo in the claim modal. Not included on the issued credential.`)
};

const es_developerportal_guides_embedclaim_configurestep_partnernamehint5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Partnernamehint5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se muestra junto a tu logo en el modal de reclamo. No se incluye en la credencial emitida.`)
};

const fr_developerportal_guides_embedclaim_configurestep_partnernamehint5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Partnernamehint5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Affiché à côté de votre logo dans la modale de réclamation. Non inclus sur le certificat émis.`)
};

const ar_developerportal_guides_embedclaim_configurestep_partnernamehint5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Partnernamehint5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يظهر بجانب شعارك في نافذة المطالبة. غير مضمن في المؤهل الصادر.`)
};

/**
* | output |
* | --- |
* | "Shown alongside your logo in the claim modal. Not included on the issued credential." |
*
* @param {Developerportal_Guides_Embedclaim_Configurestep_Partnernamehint5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_configurestep_partnernamehint5 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Configurestep_Partnernamehint5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Configurestep_Partnernamehint5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_configurestep_partnernamehint5(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_configurestep_partnernamehint5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_configurestep_partnernamehint5(inputs)
	return ar_developerportal_guides_embedclaim_configurestep_partnernamehint5(inputs)
});
export { developerportal_guides_embedclaim_configurestep_partnernamehint5 as "developerPortal.guides.embedClaim.configureStep.partnerNameHint" }