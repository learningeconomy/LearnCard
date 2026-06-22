/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Installsdkstep_Sendcredentials5Inputs */

const en_developerportal_guides_embedapp_installsdkstep_sendcredentials5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Installsdkstep_Sendcredentials5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send Credentials`)
};

const es_developerportal_guides_embedapp_installsdkstep_sendcredentials5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Installsdkstep_Sendcredentials5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviar Credenciales`)
};

const fr_developerportal_guides_embedapp_installsdkstep_sendcredentials5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Installsdkstep_Sendcredentials5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyer des Titres`)
};

const ar_developerportal_guides_embedapp_installsdkstep_sendcredentials5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Installsdkstep_Sendcredentials5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إرسال الشهادات`)
};

/**
* | output |
* | --- |
* | "Send Credentials" |
*
* @param {Developerportal_Guides_Embedapp_Installsdkstep_Sendcredentials5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_installsdkstep_sendcredentials5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Installsdkstep_Sendcredentials5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Installsdkstep_Sendcredentials5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_installsdkstep_sendcredentials5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_installsdkstep_sendcredentials5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_installsdkstep_sendcredentials5(inputs)
	return ar_developerportal_guides_embedapp_installsdkstep_sendcredentials5(inputs)
});
export { developerportal_guides_embedapp_installsdkstep_sendcredentials5 as "developerPortal.guides.embedApp.installSdkStep.sendCredentials" }