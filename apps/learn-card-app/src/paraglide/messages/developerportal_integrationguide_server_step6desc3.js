/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Server_Step6desc3Inputs */

const en_developerportal_integrationguide_server_step6desc3 = /** @type {(inputs: Developerportal_Integrationguide_Server_Step6desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You can also use the REST API directly without the SDK.`)
};

const es_developerportal_integrationguide_server_step6desc3 = /** @type {(inputs: Developerportal_Integrationguide_Server_Step6desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`También puedes usar la API REST directamente sin el SDK.`)
};

const fr_developerportal_integrationguide_server_step6desc3 = /** @type {(inputs: Developerportal_Integrationguide_Server_Step6desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous pouvez également utiliser l'API REST directement sans le SDK.`)
};

const ar_developerportal_integrationguide_server_step6desc3 = /** @type {(inputs: Developerportal_Integrationguide_Server_Step6desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يمكنك أيضاً استخدام REST API مباشرة بدون SDK.`)
};

/**
* | output |
* | --- |
* | "You can also use the REST API directly without the SDK." |
*
* @param {Developerportal_Integrationguide_Server_Step6desc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_server_step6desc3 = /** @type {((inputs?: Developerportal_Integrationguide_Server_Step6desc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Server_Step6desc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_server_step6desc3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_server_step6desc3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_server_step6desc3(inputs)
	return ar_developerportal_integrationguide_server_step6desc3(inputs)
});
export { developerportal_integrationguide_server_step6desc3 as "developerPortal.integrationGuide.server.step6Desc" }