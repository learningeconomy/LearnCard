/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Signingauthority_Notfounddesc5Inputs */

const en_developerportal_integrationguide_signingauthority_notfounddesc5 = /** @type {(inputs: Developerportal_Integrationguide_Signingauthority_Notfounddesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`A signing authority is required to sign credentials. Create one to continue.`)
};

const es_developerportal_integrationguide_signingauthority_notfounddesc5 = /** @type {(inputs: Developerportal_Integrationguide_Signingauthority_Notfounddesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se requiere una autoridad de firma para firmar credenciales. Crea una para continuar.`)
};

const fr_developerportal_integrationguide_signingauthority_notfounddesc5 = /** @type {(inputs: Developerportal_Integrationguide_Signingauthority_Notfounddesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une autorité de signature est requise pour signer les identifiants. Créez-en une pour continuer.`)
};

const ar_developerportal_integrationguide_signingauthority_notfounddesc5 = /** @type {(inputs: Developerportal_Integrationguide_Signingauthority_Notfounddesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سلطة التوقيع مطلوبة لتوقيع بيانات الاعتماد. أنشئ واحدة للمتابعة.`)
};

/**
* | output |
* | --- |
* | "A signing authority is required to sign credentials. Create one to continue." |
*
* @param {Developerportal_Integrationguide_Signingauthority_Notfounddesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_signingauthority_notfounddesc5 = /** @type {((inputs?: Developerportal_Integrationguide_Signingauthority_Notfounddesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Signingauthority_Notfounddesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_signingauthority_notfounddesc5(inputs)
	if (locale === "es") return es_developerportal_integrationguide_signingauthority_notfounddesc5(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_signingauthority_notfounddesc5(inputs)
	return ar_developerportal_integrationguide_signingauthority_notfounddesc5(inputs)
});
export { developerportal_integrationguide_signingauthority_notfounddesc5 as "developerPortal.integrationGuide.signingAuthority.notFoundDesc" }