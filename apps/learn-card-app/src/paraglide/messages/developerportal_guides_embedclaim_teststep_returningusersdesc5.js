/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Teststep_Returningusersdesc5Inputs */

const en_developerportal_guides_embedclaim_teststep_returningusersdesc5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Returningusersdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`The SDK remembers logged-in users via localStorage. On their next visit, they'll see an "Accept Credential" button instead of entering email/OTP again.`)
};

const es_developerportal_guides_embedclaim_teststep_returningusersdesc5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Returningusersdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El SDK recuerda a los usuarios conectados mediante localStorage. En su próxima visita, verán un botón "Aceptar Credencial" en lugar de ingresar correo/OTP nuevamente.`)
};

const fr_developerportal_guides_embedclaim_teststep_returningusersdesc5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Returningusersdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le SDK mémorise les utilisateurs connectés via localStorage. Lors de leur prochaine visite, ils verront un bouton « Accepter le Certificat » au lieu de saisir à nouveau leur email/OTP.`)
};

const ar_developerportal_guides_embedclaim_teststep_returningusersdesc5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Returningusersdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يتذكر SDK المستخدمين المسجلين عبر التخزين المحلي. في زيارتهم التالية، سيرون زر «قبول المؤهل» بدلاً من إدخال البريد الإلكتروني/OTP مرة أخرى.`)
};

/**
* | output |
* | --- |
* | "The SDK remembers logged-in users via localStorage. On their next visit, they'll see an \"Accept Credential\" button instead of entering email/OTP again." |
*
* @param {Developerportal_Guides_Embedclaim_Teststep_Returningusersdesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_teststep_returningusersdesc5 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Teststep_Returningusersdesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Teststep_Returningusersdesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_teststep_returningusersdesc5(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_teststep_returningusersdesc5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_teststep_returningusersdesc5(inputs)
	return ar_developerportal_guides_embedclaim_teststep_returningusersdesc5(inputs)
});
export { developerportal_guides_embedclaim_teststep_returningusersdesc5 as "developerPortal.guides.embedClaim.testStep.returningUsersDesc" }