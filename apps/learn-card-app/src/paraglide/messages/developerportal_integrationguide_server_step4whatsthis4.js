/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Server_Step4whatsthis4Inputs */

const en_developerportal_integrationguide_server_step4whatsthis4 = /** @type {(inputs: Developerportal_Integrationguide_Server_Step4whatsthis4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`If the recipient has a LearnCard wallet linked to that email, the credential is delivered instantly. Otherwise, they receive an email with a claim link.`)
};

const es_developerportal_integrationguide_server_step4whatsthis4 = /** @type {(inputs: Developerportal_Integrationguide_Server_Step4whatsthis4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Si el destinatario tiene una billetera LearnCard vinculada a ese correo, la credencial se entrega al instante. De lo contrario, reciben un correo con un enlace de reclamo.`)
};

const fr_developerportal_integrationguide_server_step4whatsthis4 = /** @type {(inputs: Developerportal_Integrationguide_Server_Step4whatsthis4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Si le destinataire a un portefeuille LearnCard lié à cet e-mail, l'identifiant est livré instantanément. Sinon, il reçoit un e-mail avec un lien de réclamation.`)
};

const ar_developerportal_integrationguide_server_step4whatsthis4 = /** @type {(inputs: Developerportal_Integrationguide_Server_Step4whatsthis4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إذا كان المستلم لديه محفظة LearnCard مرتبطة بهذا البريد الإلكتروني، فسيتم تسليم بيانات الاعتماد فوراً. بخلاف ذلك، يتلقون بريداً إلكترونياً مع رابط للمطالبة.`)
};

/**
* | output |
* | --- |
* | "If the recipient has a LearnCard wallet linked to that email, the credential is delivered instantly. Otherwise, they receive an email with a claim link." |
*
* @param {Developerportal_Integrationguide_Server_Step4whatsthis4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_server_step4whatsthis4 = /** @type {((inputs?: Developerportal_Integrationguide_Server_Step4whatsthis4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Server_Step4whatsthis4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_server_step4whatsthis4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_server_step4whatsthis4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_server_step4whatsthis4(inputs)
	return ar_developerportal_integrationguide_server_step4whatsthis4(inputs)
});
export { developerportal_integrationguide_server_step4whatsthis4 as "developerPortal.integrationGuide.server.step4WhatsThis" }