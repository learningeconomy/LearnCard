/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Configurestep_Whitelisteddomainsdesc5Inputs */

const en_developerportal_guides_embedclaim_configurestep_whitelisteddomainsdesc5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Whitelisteddomainsdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add the domains where you'll embed this claim button. The API will only accept claims from these domains.`)
};

const es_developerportal_guides_embedclaim_configurestep_whitelisteddomainsdesc5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Whitelisteddomainsdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añade los dominios donde insertarás este botón de reclamo. La API solo aceptará solicitudes desde estos dominios.`)
};

const fr_developerportal_guides_embedclaim_configurestep_whitelisteddomainsdesc5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Whitelisteddomainsdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajoutez les domaines où vous intégrerez ce bouton de réclamation. L'API n'acceptera les demandes qu'à partir de ces domaines.`)
};

const ar_developerportal_guides_embedclaim_configurestep_whitelisteddomainsdesc5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Whitelisteddomainsdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أضف النطاقات حيث ستضمّن زر المطالبة هذا. ستقبل API فقط الطلبات من هذه النطاقات.`)
};

/**
* | output |
* | --- |
* | "Add the domains where you'll embed this claim button. The API will only accept claims from these domains." |
*
* @param {Developerportal_Guides_Embedclaim_Configurestep_Whitelisteddomainsdesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_configurestep_whitelisteddomainsdesc5 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Configurestep_Whitelisteddomainsdesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Configurestep_Whitelisteddomainsdesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_configurestep_whitelisteddomainsdesc5(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_configurestep_whitelisteddomainsdesc5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_configurestep_whitelisteddomainsdesc5(inputs)
	return ar_developerportal_guides_embedclaim_configurestep_whitelisteddomainsdesc5(inputs)
});
export { developerportal_guides_embedclaim_configurestep_whitelisteddomainsdesc5 as "developerPortal.guides.embedClaim.configureStep.whitelistedDomainsDesc" }