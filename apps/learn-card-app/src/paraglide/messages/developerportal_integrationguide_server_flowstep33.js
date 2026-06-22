/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Server_Flowstep33Inputs */

const en_developerportal_integrationguide_server_flowstep33 = /** @type {(inputs: Developerportal_Integrationguide_Server_Flowstep33Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`If user has wallet → delivered instantly to their inbox`)
};

const es_developerportal_integrationguide_server_flowstep33 = /** @type {(inputs: Developerportal_Integrationguide_Server_Flowstep33Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Si el usuario tiene billetera → entregado al instante en su bandeja de entrada`)
};

const fr_developerportal_integrationguide_server_flowstep33 = /** @type {(inputs: Developerportal_Integrationguide_Server_Flowstep33Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Si l'utilisateur a un portefeuille → livré instantanément dans sa boîte de réception`)
};

const ar_developerportal_integrationguide_server_flowstep33 = /** @type {(inputs: Developerportal_Integrationguide_Server_Flowstep33Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إذا كان لدى المستخدم محفظة → يتم التسليم فوراً إلى صندوق الوارد الخاص به`)
};

/**
* | output |
* | --- |
* | "If user has wallet → delivered instantly to their inbox" |
*
* @param {Developerportal_Integrationguide_Server_Flowstep33Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_server_flowstep33 = /** @type {((inputs?: Developerportal_Integrationguide_Server_Flowstep33Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Server_Flowstep33Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_server_flowstep33(inputs)
	if (locale === "es") return es_developerportal_integrationguide_server_flowstep33(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_server_flowstep33(inputs)
	return ar_developerportal_integrationguide_server_flowstep33(inputs)
});
export { developerportal_integrationguide_server_flowstep33 as "developerPortal.integrationGuide.server.flowStep3" }