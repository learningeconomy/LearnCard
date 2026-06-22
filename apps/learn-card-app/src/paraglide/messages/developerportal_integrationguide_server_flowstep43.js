/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Server_Flowstep43Inputs */

const en_developerportal_integrationguide_server_flowstep43 = /** @type {(inputs: Developerportal_Integrationguide_Server_Flowstep43Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`If new user → email sent with magic link to claim`)
};

const es_developerportal_integrationguide_server_flowstep43 = /** @type {(inputs: Developerportal_Integrationguide_Server_Flowstep43Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Si es nuevo usuario → correo enviado con enlace mágico para reclamar`)
};

const fr_developerportal_integrationguide_server_flowstep43 = /** @type {(inputs: Developerportal_Integrationguide_Server_Flowstep43Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Si nouvel utilisateur → e-mail envoyé avec un lien magique pour réclamer`)
};

const ar_developerportal_integrationguide_server_flowstep43 = /** @type {(inputs: Developerportal_Integrationguide_Server_Flowstep43Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إذا كان مستخدماً جديداً → يتم إرسال بريد إلكتروني مع رابط سحري للمطالبة`)
};

/**
* | output |
* | --- |
* | "If new user → email sent with magic link to claim" |
*
* @param {Developerportal_Integrationguide_Server_Flowstep43Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_server_flowstep43 = /** @type {((inputs?: Developerportal_Integrationguide_Server_Flowstep43Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Server_Flowstep43Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_server_flowstep43(inputs)
	if (locale === "es") return es_developerportal_integrationguide_server_flowstep43(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_server_flowstep43(inputs)
	return ar_developerportal_integrationguide_server_flowstep43(inputs)
});
export { developerportal_integrationguide_server_flowstep43 as "developerPortal.integrationGuide.server.flowStep4" }