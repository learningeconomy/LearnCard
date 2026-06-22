/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Server_Flowstep53Inputs */

const en_developerportal_integrationguide_server_flowstep53 = /** @type {(inputs: Developerportal_Integrationguide_Server_Flowstep53Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Webhook notifies you of delivery status`)
};

const es_developerportal_integrationguide_server_flowstep53 = /** @type {(inputs: Developerportal_Integrationguide_Server_Flowstep53Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El webhook te notifica el estado de entrega`)
};

const fr_developerportal_integrationguide_server_flowstep53 = /** @type {(inputs: Developerportal_Integrationguide_Server_Flowstep53Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le webhook vous notifie du statut de livraison`)
};

const ar_developerportal_integrationguide_server_flowstep53 = /** @type {(inputs: Developerportal_Integrationguide_Server_Flowstep53Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يخبرك webhook بحالة التسليم`)
};

/**
* | output |
* | --- |
* | "Webhook notifies you of delivery status" |
*
* @param {Developerportal_Integrationguide_Server_Flowstep53Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_server_flowstep53 = /** @type {((inputs?: Developerportal_Integrationguide_Server_Flowstep53Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Server_Flowstep53Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_server_flowstep53(inputs)
	if (locale === "es") return es_developerportal_integrationguide_server_flowstep53(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_server_flowstep53(inputs)
	return ar_developerportal_integrationguide_server_flowstep53(inputs)
});
export { developerportal_integrationguide_server_flowstep53 as "developerPortal.integrationGuide.server.flowStep5" }