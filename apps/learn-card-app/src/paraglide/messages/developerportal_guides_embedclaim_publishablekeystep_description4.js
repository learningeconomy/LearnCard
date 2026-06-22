/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Publishablekeystep_Description4Inputs */

const en_developerportal_guides_embedclaim_publishablekeystep_description4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Publishablekeystep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use this publishable key to authenticate credential claims from your website. It's safe to expose in client-side code.`)
};

const es_developerportal_guides_embedclaim_publishablekeystep_description4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Publishablekeystep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Usa esta clave pública para autenticar solicitudes de credenciales desde tu sitio web. Es segura para exponer en código del lado del cliente.`)
};

const fr_developerportal_guides_embedclaim_publishablekeystep_description4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Publishablekeystep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utilisez cette clé publique pour authentifier les demandes de certificats depuis votre site web. Vous pouvez l'exposer sans risque dans le code côté client.`)
};

const ar_developerportal_guides_embedclaim_publishablekeystep_description4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Publishablekeystep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استخدم هذا المفتاح العام للمصادقة على طلبات المؤهلات من موقعك على الويب. من الآمن عرضه في كود جانب العميل.`)
};

/**
* | output |
* | --- |
* | "Use this publishable key to authenticate credential claims from your website. It's safe to expose in client-side code." |
*
* @param {Developerportal_Guides_Embedclaim_Publishablekeystep_Description4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_publishablekeystep_description4 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Publishablekeystep_Description4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Publishablekeystep_Description4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_publishablekeystep_description4(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_publishablekeystep_description4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_publishablekeystep_description4(inputs)
	return ar_developerportal_guides_embedclaim_publishablekeystep_description4(inputs)
});
export { developerportal_guides_embedclaim_publishablekeystep_description4 as "developerPortal.guides.embedClaim.publishableKeyStep.description" }