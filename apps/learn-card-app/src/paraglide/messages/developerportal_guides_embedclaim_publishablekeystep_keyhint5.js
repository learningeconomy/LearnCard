/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Publishablekeystep_Keyhint5Inputs */

const en_developerportal_guides_embedclaim_publishablekeystep_keyhint5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Publishablekeystep_Keyhint5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This key can only be used to claim credentials. Keep your secret key secure on your server.`)
};

const es_developerportal_guides_embedclaim_publishablekeystep_keyhint5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Publishablekeystep_Keyhint5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esta clave solo se puede usar para reclamar credenciales. Mantén tu clave secreta segura en tu servidor.`)
};

const fr_developerportal_guides_embedclaim_publishablekeystep_keyhint5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Publishablekeystep_Keyhint5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cette clé ne peut être utilisée que pour réclamer des certificats. Gardez votre clé secrète en sécurité sur votre serveur.`)
};

const ar_developerportal_guides_embedclaim_publishablekeystep_keyhint5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Publishablekeystep_Keyhint5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يمكن استخدام هذا المفتاح فقط للمطالبة بالمؤهلات. احتفظ بمفتاحك السري بأمان على الخادم الخاص بك.`)
};

/**
* | output |
* | --- |
* | "This key can only be used to claim credentials. Keep your secret key secure on your server." |
*
* @param {Developerportal_Guides_Embedclaim_Publishablekeystep_Keyhint5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_publishablekeystep_keyhint5 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Publishablekeystep_Keyhint5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Publishablekeystep_Keyhint5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_publishablekeystep_keyhint5(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_publishablekeystep_keyhint5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_publishablekeystep_keyhint5(inputs)
	return ar_developerportal_guides_embedclaim_publishablekeystep_keyhint5(inputs)
});
export { developerportal_guides_embedclaim_publishablekeystep_keyhint5 as "developerPortal.guides.embedClaim.publishableKeyStep.keyHint" }