/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Sendcredentialsstep_Step2info5Inputs */

const en_developerportal_guides_consentflow_sendcredentialsstep_step2info5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Sendcredentialsstep_Step2info5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What this does: Issues the credential from your template to the user and writes it to your consent flow contract — all in one call.`)
};

const es_developerportal_guides_consentflow_sendcredentialsstep_step2info5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Sendcredentialsstep_Step2info5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lo que hace: Emite la credencial de tu plantilla al usuario y la escribe en tu contrato de flujo de consentimiento — todo en una sola llamada.`)
};

const fr_developerportal_guides_consentflow_sendcredentialsstep_step2info5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Sendcredentialsstep_Step2info5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ce que cela fait : Émet le certificat de votre modèle vers l'utilisateur et l'écrit dans votre contrat de flux de consentement — tout en un seul appel.`)
};

const ar_developerportal_guides_consentflow_sendcredentialsstep_step2info5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Sendcredentialsstep_Step2info5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ما يفعله هذا: يصدر المؤهل من قالبك إلى المستخدم ويكتبه في عقد تدفق الموافقة الخاص بك — كل ذلك في استدعاء واحد.`)
};

/**
* | output |
* | --- |
* | "What this does: Issues the credential from your template to the user and writes it to your consent flow contract — all in one call." |
*
* @param {Developerportal_Guides_Consentflow_Sendcredentialsstep_Step2info5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_sendcredentialsstep_step2info5 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Sendcredentialsstep_Step2info5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Sendcredentialsstep_Step2info5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_sendcredentialsstep_step2info5(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_sendcredentialsstep_step2info5(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_sendcredentialsstep_step2info5(inputs)
	return ar_developerportal_guides_consentflow_sendcredentialsstep_step2info5(inputs)
});
export { developerportal_guides_consentflow_sendcredentialsstep_step2info5 as "developerPortal.guides.consentFlow.sendCredentialsStep.step2Info" }