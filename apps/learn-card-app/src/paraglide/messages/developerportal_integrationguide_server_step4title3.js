/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Server_Step4title3Inputs */

const en_developerportal_integrationguide_server_step4title3 = /** @type {(inputs: Developerportal_Integrationguide_Server_Step4title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue Credential via Universal Inbox`)
};

const es_developerportal_integrationguide_server_step4title3 = /** @type {(inputs: Developerportal_Integrationguide_Server_Step4title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emitir Credencial mediante Universal Inbox`)
};

const fr_developerportal_integrationguide_server_step4title3 = /** @type {(inputs: Developerportal_Integrationguide_Server_Step4title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émettre un Identifiant via Universal Inbox`)
};

const ar_developerportal_integrationguide_server_step4title3 = /** @type {(inputs: Developerportal_Integrationguide_Server_Step4title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إصدار بيانات الاعتماد عبر Universal Inbox`)
};

/**
* | output |
* | --- |
* | "Issue Credential via Universal Inbox" |
*
* @param {Developerportal_Integrationguide_Server_Step4title3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_server_step4title3 = /** @type {((inputs?: Developerportal_Integrationguide_Server_Step4title3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Server_Step4title3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_server_step4title3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_server_step4title3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_server_step4title3(inputs)
	return ar_developerportal_integrationguide_server_step4title3(inputs)
});
export { developerportal_integrationguide_server_step4title3 as "developerPortal.integrationGuide.server.step4Title" }