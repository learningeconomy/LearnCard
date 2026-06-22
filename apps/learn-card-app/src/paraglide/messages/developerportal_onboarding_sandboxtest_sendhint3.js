/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Sandboxtest_Sendhint3Inputs */

const en_developerportal_onboarding_sandboxtest_sendhint3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Sendhint3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`We'll issue a test credential with sample data and send it to this email address. Check your inbox for a claim link to view the credential.`)
};

const es_developerportal_onboarding_sandboxtest_sendhint3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Sendhint3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emitiremos una credencial de prueba con datos de muestra y la enviaremos a esta dirección de email. Revisa tu bandeja de entrada para ver el enlace de reclamación.`)
};

const fr_developerportal_onboarding_sandboxtest_sendhint3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Sendhint3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nous allons émettre un credential de test avec des données d'exemple et l'envoyer à cette adresse email. Vérifiez votre boîte de réception pour voir le lien de réclamation.`)
};

const ar_developerportal_onboarding_sandboxtest_sendhint3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Sendhint3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سنصدر بيانات اعتماد اختبارية مع بيانات نموذجية ونرسلها إلى عنوان البريد الإلكتروني هذا. تحقق من صندوق الوارد الخاص بك لرؤية رابط المطالبة.`)
};

/**
* | output |
* | --- |
* | "We'll issue a test credential with sample data and send it to this email address. Check your inbox for a claim link to view the credential." |
*
* @param {Developerportal_Onboarding_Sandboxtest_Sendhint3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_sandboxtest_sendhint3 = /** @type {((inputs?: Developerportal_Onboarding_Sandboxtest_Sendhint3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Sandboxtest_Sendhint3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_sandboxtest_sendhint3(inputs)
	if (locale === "es") return es_developerportal_onboarding_sandboxtest_sendhint3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_sandboxtest_sendhint3(inputs)
	return ar_developerportal_onboarding_sandboxtest_sendhint3(inputs)
});
export { developerportal_onboarding_sandboxtest_sendhint3 as "developerPortal.onboarding.sandboxTest.sendHint" }