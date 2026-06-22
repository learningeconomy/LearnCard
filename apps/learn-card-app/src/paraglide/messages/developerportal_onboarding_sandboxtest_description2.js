/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Sandboxtest_Description2Inputs */

const en_developerportal_onboarding_sandboxtest_description2 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Let's make sure everything works before going live. Send yourself a test credential to verify your templates are configured correctly.`)
};

const es_developerportal_onboarding_sandboxtest_description2 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Asegurémonos de que todo funcione antes de publicar. Envíate una credencial de prueba para verificar que tus plantillas estén configuradas correctamente.`)
};

const fr_developerportal_onboarding_sandboxtest_description2 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Assurons-nous que tout fonctionne avant la mise en ligne. Envoyez-vous un credential de test pour vérifier que vos modèles sont correctement configurés.`)
};

const ar_developerportal_onboarding_sandboxtest_description2 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`دعنا نتأكد من أن كل شيء يعمل قبل النشر. أرسل لنفسك بيانات اعتماد اختبارية للتحقق من تكوين قوالبك بشكل صحيح.`)
};

/**
* | output |
* | --- |
* | "Let's make sure everything works before going live. Send yourself a test credential to verify your templates are configured correctly." |
*
* @param {Developerportal_Onboarding_Sandboxtest_Description2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_sandboxtest_description2 = /** @type {((inputs?: Developerportal_Onboarding_Sandboxtest_Description2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Sandboxtest_Description2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_sandboxtest_description2(inputs)
	if (locale === "es") return es_developerportal_onboarding_sandboxtest_description2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_sandboxtest_description2(inputs)
	return ar_developerportal_onboarding_sandboxtest_description2(inputs)
});
export { developerportal_onboarding_sandboxtest_description2 as "developerPortal.onboarding.sandboxTest.description" }