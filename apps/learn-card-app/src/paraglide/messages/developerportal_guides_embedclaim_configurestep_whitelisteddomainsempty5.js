/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Configurestep_Whitelisteddomainsempty5Inputs */

const en_developerportal_guides_embedclaim_configurestep_whitelisteddomainsempty5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Whitelisteddomainsempty5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No domains whitelisted yet. The embed will not work until you add at least one domain.`)
};

const es_developerportal_guides_embedclaim_configurestep_whitelisteddomainsempty5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Whitelisteddomainsempty5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay dominios permitidos. La inserción no funcionará hasta que añadas al menos un dominio.`)
};

const fr_developerportal_guides_embedclaim_configurestep_whitelisteddomainsempty5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Whitelisteddomainsempty5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun domaine autorisé pour l'instant. L'intégration ne fonctionnera pas tant que vous n'aurez pas ajouté au moins un domaine.`)
};

const ar_developerportal_guides_embedclaim_configurestep_whitelisteddomainsempty5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Whitelisteddomainsempty5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد نطاقات مسموح بها بعد. لن يعمل التضمين حتى تضيف نطاقاً واحداً على الأقل.`)
};

/**
* | output |
* | --- |
* | "No domains whitelisted yet. The embed will not work until you add at least one domain." |
*
* @param {Developerportal_Guides_Embedclaim_Configurestep_Whitelisteddomainsempty5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_configurestep_whitelisteddomainsempty5 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Configurestep_Whitelisteddomainsempty5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Configurestep_Whitelisteddomainsempty5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_configurestep_whitelisteddomainsempty5(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_configurestep_whitelisteddomainsempty5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_configurestep_whitelisteddomainsempty5(inputs)
	return ar_developerportal_guides_embedclaim_configurestep_whitelisteddomainsempty5(inputs)
});
export { developerportal_guides_embedclaim_configurestep_whitelisteddomainsempty5 as "developerPortal.guides.embedClaim.configureStep.whitelistedDomainsEmpty" }