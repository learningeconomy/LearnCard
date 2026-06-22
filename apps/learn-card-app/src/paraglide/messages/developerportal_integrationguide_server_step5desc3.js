/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Server_Step5desc3Inputs */

const en_developerportal_integrationguide_server_step5desc3 = /** @type {(inputs: Developerportal_Integrationguide_Server_Step5desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Receive notifications when credentials are delivered or claimed.`)
};

const es_developerportal_integrationguide_server_step5desc3 = /** @type {(inputs: Developerportal_Integrationguide_Server_Step5desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recibe notificaciones cuando las credenciales se entregan o reclaman.`)
};

const fr_developerportal_integrationguide_server_step5desc3 = /** @type {(inputs: Developerportal_Integrationguide_Server_Step5desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recevez des notifications lorsque les identifiants sont livrés ou réclamés.`)
};

const ar_developerportal_integrationguide_server_step5desc3 = /** @type {(inputs: Developerportal_Integrationguide_Server_Step5desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تلقي الإشعارات عند تسليم بيانات الاعتماد أو المطالبة بها.`)
};

/**
* | output |
* | --- |
* | "Receive notifications when credentials are delivered or claimed." |
*
* @param {Developerportal_Integrationguide_Server_Step5desc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_server_step5desc3 = /** @type {((inputs?: Developerportal_Integrationguide_Server_Step5desc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Server_Step5desc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_server_step5desc3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_server_step5desc3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_server_step5desc3(inputs)
	return ar_developerportal_integrationguide_server_step5desc3(inputs)
});
export { developerportal_integrationguide_server_step5desc3 as "developerPortal.integrationGuide.server.step5Desc" }