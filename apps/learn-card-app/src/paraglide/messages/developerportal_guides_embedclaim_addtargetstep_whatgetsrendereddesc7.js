/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Addtargetstep_Whatgetsrendereddesc7Inputs */

const en_developerportal_guides_embedclaim_addtargetstep_whatgetsrendereddesc7 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Addtargetstep_Whatgetsrendereddesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`The SDK replaces the target element with a styled button. When clicked, it opens a modal for the user to verify their email and claim the credential.`)
};

const es_developerportal_guides_embedclaim_addtargetstep_whatgetsrendereddesc7 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Addtargetstep_Whatgetsrendereddesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El SDK reemplaza el elemento destino con un botón estilizado. Al hacer clic, abre un modal para que el usuario verifique su correo y reclame la credencial.`)
};

const fr_developerportal_guides_embedclaim_addtargetstep_whatgetsrendereddesc7 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Addtargetstep_Whatgetsrendereddesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le SDK remplace l'élément cible par un bouton stylisé. Lorsqu'on clique dessus, une modale s'ouvre pour que l'utilisateur vérifie son email et réclame le certificat.`)
};

const ar_developerportal_guides_embedclaim_addtargetstep_whatgetsrendereddesc7 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Addtargetstep_Whatgetsrendereddesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يستبدل SDK العنصر الهدف بزر منسق. عند النقر، يفتح نافذة منبثقة للتحقق من البريد الإلكتروني والمطالبة بالمؤهل.`)
};

/**
* | output |
* | --- |
* | "The SDK replaces the target element with a styled button. When clicked, it opens a modal for the user to verify their email and claim the credential." |
*
* @param {Developerportal_Guides_Embedclaim_Addtargetstep_Whatgetsrendereddesc7Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_addtargetstep_whatgetsrendereddesc7 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Addtargetstep_Whatgetsrendereddesc7Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Addtargetstep_Whatgetsrendereddesc7Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_addtargetstep_whatgetsrendereddesc7(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_addtargetstep_whatgetsrendereddesc7(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_addtargetstep_whatgetsrendereddesc7(inputs)
	return ar_developerportal_guides_embedclaim_addtargetstep_whatgetsrendereddesc7(inputs)
});
export { developerportal_guides_embedclaim_addtargetstep_whatgetsrendereddesc7 as "developerPortal.guides.embedClaim.addTargetStep.whatGetsRenderedDesc" }