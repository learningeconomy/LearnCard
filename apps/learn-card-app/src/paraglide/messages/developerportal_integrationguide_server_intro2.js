/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Server_Intro2Inputs */

const en_developerportal_integrationguide_server_intro2 = /** @type {(inputs: Developerportal_Integrationguide_Server_Intro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Server Headless integration uses the Universal Inbox API to issue credentials directly to users via email or phone — no wallet interaction required from your side.`)
};

const es_developerportal_integrationguide_server_intro2 = /** @type {(inputs: Developerportal_Integrationguide_Server_Intro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La integración Headless de Servidor usa la API de Universal Inbox para emitir credenciales directamente a los usuarios por correo electrónico o teléfono — no se requiere interacción con la billetera desde tu lado.`)
};

const fr_developerportal_integrationguide_server_intro2 = /** @type {(inputs: Developerportal_Integrationguide_Server_Intro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`L'intégration Headless Serveur utilise l'API Universal Inbox pour émettre des identifiants directement aux utilisateurs par e-mail ou téléphone — aucune interaction avec le portefeuille n'est requise de votre côté.`)
};

const ar_developerportal_integrationguide_server_intro2 = /** @type {(inputs: Developerportal_Integrationguide_Server_Intro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يستخدم تكامل الخادم بدون واجهة Universal Inbox API لإصدار بيانات الاعتماد مباشرة للمستخدمين عبر البريد الإلكتروني أو الهاتف — بدون الحاجة إلى تفاعل المحفظة من جانبك.`)
};

/**
* | output |
* | --- |
* | "Server Headless integration uses the Universal Inbox API to issue credentials directly to users via email or phone — no wallet interaction required from your..." |
*
* @param {Developerportal_Integrationguide_Server_Intro2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_server_intro2 = /** @type {((inputs?: Developerportal_Integrationguide_Server_Intro2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Server_Intro2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_server_intro2(inputs)
	if (locale === "es") return es_developerportal_integrationguide_server_intro2(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_server_intro2(inputs)
	return ar_developerportal_integrationguide_server_intro2(inputs)
});
export { developerportal_integrationguide_server_intro2 as "developerPortal.integrationGuide.server.intro" }