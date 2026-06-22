/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Server_Step4desc3Inputs */

const en_developerportal_integrationguide_server_step4desc3 = /** @type {(inputs: Developerportal_Integrationguide_Server_Step4desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send credentials to users by email or phone. LearnCard handles delivery automatically.`)
};

const es_developerportal_integrationguide_server_step4desc3 = /** @type {(inputs: Developerportal_Integrationguide_Server_Step4desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envía credenciales a los usuarios por correo electrónico o teléfono. LearnCard maneja la entrega automáticamente.`)
};

const fr_developerportal_integrationguide_server_step4desc3 = /** @type {(inputs: Developerportal_Integrationguide_Server_Step4desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyez des identifiants aux utilisateurs par e-mail ou téléphone. LearnCard gère la livraison automatiquement.`)
};

const ar_developerportal_integrationguide_server_step4desc3 = /** @type {(inputs: Developerportal_Integrationguide_Server_Step4desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أرسل بيانات الاعتماد للمستخدمين عبر البريد الإلكتروني أو الهاتف. يتولى LearnCard التسليم تلقائياً.`)
};

/**
* | output |
* | --- |
* | "Send credentials to users by email or phone. LearnCard handles delivery automatically." |
*
* @param {Developerportal_Integrationguide_Server_Step4desc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_server_step4desc3 = /** @type {((inputs?: Developerportal_Integrationguide_Server_Step4desc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Server_Step4desc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_server_step4desc3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_server_step4desc3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_server_step4desc3(inputs)
	return ar_developerportal_integrationguide_server_step4desc3(inputs)
});
export { developerportal_integrationguide_server_step4desc3 as "developerPortal.integrationGuide.server.step4Desc" }