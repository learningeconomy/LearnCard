/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Server_Step1desc3Inputs */

const en_developerportal_integrationguide_server_step1desc3 = /** @type {(inputs: Developerportal_Integrationguide_Server_Step1desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`A signing authority is required to sign credentials on your behalf.`)
};

const es_developerportal_integrationguide_server_step1desc3 = /** @type {(inputs: Developerportal_Integrationguide_Server_Step1desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se requiere una autoridad de firma para firmar credenciales en tu nombre.`)
};

const fr_developerportal_integrationguide_server_step1desc3 = /** @type {(inputs: Developerportal_Integrationguide_Server_Step1desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une autorité de signature est requise pour signer les identifiants en votre nom.`)
};

const ar_developerportal_integrationguide_server_step1desc3 = /** @type {(inputs: Developerportal_Integrationguide_Server_Step1desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سلطة التوقيع مطلوبة لتوقيع بيانات الاعتماد نيابة عنك.`)
};

/**
* | output |
* | --- |
* | "A signing authority is required to sign credentials on your behalf." |
*
* @param {Developerportal_Integrationguide_Server_Step1desc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_server_step1desc3 = /** @type {((inputs?: Developerportal_Integrationguide_Server_Step1desc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Server_Step1desc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_server_step1desc3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_server_step1desc3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_server_step1desc3(inputs)
	return ar_developerportal_integrationguide_server_step1desc3(inputs)
});
export { developerportal_integrationguide_server_step1desc3 as "developerPortal.integrationGuide.server.step1Desc" }