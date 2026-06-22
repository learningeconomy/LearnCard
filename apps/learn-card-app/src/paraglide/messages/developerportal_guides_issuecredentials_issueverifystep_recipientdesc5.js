/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Issueverifystep_Recipientdesc5Inputs */

const en_developerportal_guides_issuecredentials_issueverifystep_recipientdesc5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Recipientdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enter a recipient to see the send code. Supports email, DID, phone, or profile ID.`)
};

const es_developerportal_guides_issuecredentials_issueverifystep_recipientdesc5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Recipientdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ingresa un destinatario para ver el código de envío. Soporta correo electrónico, DID, teléfono o ID de perfil.`)
};

const fr_developerportal_guides_issuecredentials_issueverifystep_recipientdesc5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Recipientdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Saisissez un destinataire pour voir le code d'envoi. Prend en charge l'email, le DID, le téléphone ou l'ID de profil.`)
};

const ar_developerportal_guides_issuecredentials_issueverifystep_recipientdesc5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Recipientdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أدخل مستلماً لرؤية كود الإرسال. يدعم البريد الإلكتروني و DID والهاتف أو معرف الملف الشخصي.`)
};

/**
* | output |
* | --- |
* | "Enter a recipient to see the send code. Supports email, DID, phone, or profile ID." |
*
* @param {Developerportal_Guides_Issuecredentials_Issueverifystep_Recipientdesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_issueverifystep_recipientdesc5 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Issueverifystep_Recipientdesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Issueverifystep_Recipientdesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_issueverifystep_recipientdesc5(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_issueverifystep_recipientdesc5(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_issueverifystep_recipientdesc5(inputs)
	return ar_developerportal_guides_issuecredentials_issueverifystep_recipientdesc5(inputs)
});
export { developerportal_guides_issuecredentials_issueverifystep_recipientdesc5 as "developerPortal.guides.issueCredentials.issueVerifyStep.recipientDesc" }