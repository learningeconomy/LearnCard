/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Server_Step5title3Inputs */

const en_developerportal_integrationguide_server_step5title3 = /** @type {(inputs: Developerportal_Integrationguide_Server_Step5title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Handle Webhook Events (Optional)`)
};

const es_developerportal_integrationguide_server_step5title3 = /** @type {(inputs: Developerportal_Integrationguide_Server_Step5title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manejar Eventos de Webhook (Opcional)`)
};

const fr_developerportal_integrationguide_server_step5title3 = /** @type {(inputs: Developerportal_Integrationguide_Server_Step5title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gérer les Événements Webhook (Optionnel)`)
};

const ar_developerportal_integrationguide_server_step5title3 = /** @type {(inputs: Developerportal_Integrationguide_Server_Step5title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معالجة أحداث Webhook (اختياري)`)
};

/**
* | output |
* | --- |
* | "Handle Webhook Events (Optional)" |
*
* @param {Developerportal_Integrationguide_Server_Step5title3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_server_step5title3 = /** @type {((inputs?: Developerportal_Integrationguide_Server_Step5title3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Server_Step5title3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_server_step5title3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_server_step5title3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_server_step5title3(inputs)
	return ar_developerportal_integrationguide_server_step5title3(inputs)
});
export { developerportal_integrationguide_server_step5title3 as "developerPortal.integrationGuide.server.step5Title" }