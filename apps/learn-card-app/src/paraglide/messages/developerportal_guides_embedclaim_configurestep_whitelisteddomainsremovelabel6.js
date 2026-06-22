/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ domain: NonNullable<unknown> }} Developerportal_Guides_Embedclaim_Configurestep_Whitelisteddomainsremovelabel6Inputs */

const en_developerportal_guides_embedclaim_configurestep_whitelisteddomainsremovelabel6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Whitelisteddomainsremovelabel6Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Remove ${i?.domain}`)
};

const es_developerportal_guides_embedclaim_configurestep_whitelisteddomainsremovelabel6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Whitelisteddomainsremovelabel6Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Eliminar ${i?.domain}`)
};

const fr_developerportal_guides_embedclaim_configurestep_whitelisteddomainsremovelabel6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Whitelisteddomainsremovelabel6Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Supprimer ${i?.domain}`)
};

const ar_developerportal_guides_embedclaim_configurestep_whitelisteddomainsremovelabel6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Whitelisteddomainsremovelabel6Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`إزالة ${i?.domain}`)
};

/**
* | output |
* | --- |
* | "Remove {domain}" |
*
* @param {Developerportal_Guides_Embedclaim_Configurestep_Whitelisteddomainsremovelabel6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_configurestep_whitelisteddomainsremovelabel6 = /** @type {((inputs: Developerportal_Guides_Embedclaim_Configurestep_Whitelisteddomainsremovelabel6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Configurestep_Whitelisteddomainsremovelabel6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_configurestep_whitelisteddomainsremovelabel6(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_configurestep_whitelisteddomainsremovelabel6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_configurestep_whitelisteddomainsremovelabel6(inputs)
	return ar_developerportal_guides_embedclaim_configurestep_whitelisteddomainsremovelabel6(inputs)
});
export { developerportal_guides_embedclaim_configurestep_whitelisteddomainsremovelabel6 as "developerPortal.guides.embedClaim.configureStep.whitelistedDomainsRemoveLabel" }