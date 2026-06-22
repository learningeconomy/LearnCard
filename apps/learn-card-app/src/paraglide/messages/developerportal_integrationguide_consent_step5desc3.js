/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Consent_Step5desc3Inputs */

const en_developerportal_integrationguide_consent_step5desc3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step5desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`When you're ready to send a credential to a user, use the simplified send method. This handles credential creation, signing, and delivery in one call.`)
};

const es_developerportal_integrationguide_consent_step5desc3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step5desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cuando estés listo para enviar un credential a un usuario, usa el método simplificado send. Esto maneja la creación, firma y entrega del credential en una sola llamada.`)
};

const fr_developerportal_integrationguide_consent_step5desc3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step5desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lorsque vous êtes prêt à envoyer un identifiant à un utilisateur, utilisez la méthode simplifiée send. Cela gère la création, la signature et la livraison de l'identifiant en un seul appel.`)
};

const ar_developerportal_integrationguide_consent_step5desc3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step5desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عندما تكون مستعداً لإرسال بيانات اعتماد إلى مستخدم، استخدم الطريقة المبسطة send. يتولى هذا إنشاء بيانات الاعتماد وتوقيعها وتسليمها في استدعاء واحد.`)
};

/**
* | output |
* | --- |
* | "When you're ready to send a credential to a user, use the simplified send method. This handles credential creation, signing, and delivery in one call." |
*
* @param {Developerportal_Integrationguide_Consent_Step5desc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_consent_step5desc3 = /** @type {((inputs?: Developerportal_Integrationguide_Consent_Step5desc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Consent_Step5desc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_consent_step5desc3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_consent_step5desc3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_consent_step5desc3(inputs)
	return ar_developerportal_integrationguide_consent_step5desc3(inputs)
});
export { developerportal_integrationguide_consent_step5desc3 as "developerPortal.integrationGuide.consent.step5Desc" }