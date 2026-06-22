/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Server_Flowstep23Inputs */

const en_developerportal_integrationguide_server_flowstep23 = /** @type {(inputs: Developerportal_Integrationguide_Server_Flowstep23Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`LearnCard signs the credential with your signing authority`)
};

const es_developerportal_integrationguide_server_flowstep23 = /** @type {(inputs: Developerportal_Integrationguide_Server_Flowstep23Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`LearnCard firma la credencial con tu autoridad de firma`)
};

const fr_developerportal_integrationguide_server_flowstep23 = /** @type {(inputs: Developerportal_Integrationguide_Server_Flowstep23Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`LearnCard signe l'identifiant avec votre autorité de signature`)
};

const ar_developerportal_integrationguide_server_flowstep23 = /** @type {(inputs: Developerportal_Integrationguide_Server_Flowstep23Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يوقع LearnCard بيانات الاعتماد باستخدام سلطة التوقيع الخاصة بك`)
};

/**
* | output |
* | --- |
* | "LearnCard signs the credential with your signing authority" |
*
* @param {Developerportal_Integrationguide_Server_Flowstep23Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_server_flowstep23 = /** @type {((inputs?: Developerportal_Integrationguide_Server_Flowstep23Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Server_Flowstep23Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_server_flowstep23(inputs)
	if (locale === "es") return es_developerportal_integrationguide_server_flowstep23(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_server_flowstep23(inputs)
	return ar_developerportal_integrationguide_server_flowstep23(inputs)
});
export { developerportal_integrationguide_server_flowstep23 as "developerPortal.integrationGuide.server.flowStep2" }