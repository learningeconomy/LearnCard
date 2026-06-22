/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialsenttoemail7Inputs */

const en_developerportal_guides_issuecredentials_issueverifystep_credentialsenttoemail7 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialsenttoemail7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential sent successfully to email/phone recipient!`)
};

const es_developerportal_guides_issuecredentials_issueverifystep_credentialsenttoemail7 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialsenttoemail7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Credencial enviada exitosamente al destinatario de correo/teléfono!`)
};

const fr_developerportal_guides_issuecredentials_issueverifystep_credentialsenttoemail7 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialsenttoemail7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Certificat envoyé avec succès au destinataire email/téléphone !`)
};

const ar_developerportal_guides_issuecredentials_issueverifystep_credentialsenttoemail7 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialsenttoemail7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إرسال المؤهل بنجاح إلى مستلم البريد الإلكتروني/الهاتف!`)
};

/**
* | output |
* | --- |
* | "Credential sent successfully to email/phone recipient!" |
*
* @param {Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialsenttoemail7Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_issueverifystep_credentialsenttoemail7 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialsenttoemail7Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialsenttoemail7Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_issueverifystep_credentialsenttoemail7(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_issueverifystep_credentialsenttoemail7(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_issueverifystep_credentialsenttoemail7(inputs)
	return ar_developerportal_guides_issuecredentials_issueverifystep_credentialsenttoemail7(inputs)
});
export { developerportal_guides_issuecredentials_issueverifystep_credentialsenttoemail7 as "developerPortal.guides.issueCredentials.issueVerifyStep.credentialSentToEmail" }