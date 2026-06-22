/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Server_Flowstep13Inputs */

const en_developerportal_integrationguide_server_flowstep13 = /** @type {(inputs: Developerportal_Integrationguide_Server_Flowstep13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your server calls inbox.issue with email + credential`)
};

const es_developerportal_integrationguide_server_flowstep13 = /** @type {(inputs: Developerportal_Integrationguide_Server_Flowstep13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu servidor llama a inbox.issue con correo electrónico + credencial`)
};

const fr_developerportal_integrationguide_server_flowstep13 = /** @type {(inputs: Developerportal_Integrationguide_Server_Flowstep13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre serveur appelle inbox.issue avec e-mail + identifiant`)
};

const ar_developerportal_integrationguide_server_flowstep13 = /** @type {(inputs: Developerportal_Integrationguide_Server_Flowstep13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يستدعي خادمك inbox.issue مع البريد الإلكتروني + بيانات الاعتماد`)
};

/**
* | output |
* | --- |
* | "Your server calls inbox.issue with email + credential" |
*
* @param {Developerportal_Integrationguide_Server_Flowstep13Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_server_flowstep13 = /** @type {((inputs?: Developerportal_Integrationguide_Server_Flowstep13Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Server_Flowstep13Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_server_flowstep13(inputs)
	if (locale === "es") return es_developerportal_integrationguide_server_flowstep13(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_server_flowstep13(inputs)
	return ar_developerportal_integrationguide_server_flowstep13(inputs)
});
export { developerportal_integrationguide_server_flowstep13 as "developerPortal.integrationGuide.server.flowStep1" }