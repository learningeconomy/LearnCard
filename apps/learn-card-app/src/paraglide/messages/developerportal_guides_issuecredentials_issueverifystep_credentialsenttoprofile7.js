/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialsenttoprofile7Inputs */

const en_developerportal_guides_issuecredentials_issueverifystep_credentialsenttoprofile7 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialsenttoprofile7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential sent successfully to profile!`)
};

const es_developerportal_guides_issuecredentials_issueverifystep_credentialsenttoprofile7 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialsenttoprofile7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Credencial enviada exitosamente al perfil!`)
};

const fr_developerportal_guides_issuecredentials_issueverifystep_credentialsenttoprofile7 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialsenttoprofile7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Certificat envoyé avec succès au profil !`)
};

const ar_developerportal_guides_issuecredentials_issueverifystep_credentialsenttoprofile7 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialsenttoprofile7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إرسال المؤهل بنجاح إلى الملف الشخصي!`)
};

/**
* | output |
* | --- |
* | "Credential sent successfully to profile!" |
*
* @param {Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialsenttoprofile7Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_issueverifystep_credentialsenttoprofile7 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialsenttoprofile7Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialsenttoprofile7Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_issueverifystep_credentialsenttoprofile7(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_issueverifystep_credentialsenttoprofile7(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_issueverifystep_credentialsenttoprofile7(inputs)
	return ar_developerportal_guides_issuecredentials_issueverifystep_credentialsenttoprofile7(inputs)
});
export { developerportal_guides_issuecredentials_issueverifystep_credentialsenttoprofile7 as "developerPortal.guides.issueCredentials.issueVerifyStep.credentialSentToProfile" }