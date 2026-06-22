/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Server_Viewdocs3Inputs */

const en_developerportal_integrationguide_server_viewdocs3 = /** @type {(inputs: Developerportal_Integrationguide_Server_Viewdocs3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View Universal Inbox Documentation`)
};

const es_developerportal_integrationguide_server_viewdocs3 = /** @type {(inputs: Developerportal_Integrationguide_Server_Viewdocs3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver Documentación de Universal Inbox`)
};

const fr_developerportal_integrationguide_server_viewdocs3 = /** @type {(inputs: Developerportal_Integrationguide_Server_Viewdocs3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir la Documentation d'Universal Inbox`)
};

const ar_developerportal_integrationguide_server_viewdocs3 = /** @type {(inputs: Developerportal_Integrationguide_Server_Viewdocs3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض توثيق Universal Inbox`)
};

/**
* | output |
* | --- |
* | "View Universal Inbox Documentation" |
*
* @param {Developerportal_Integrationguide_Server_Viewdocs3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_server_viewdocs3 = /** @type {((inputs?: Developerportal_Integrationguide_Server_Viewdocs3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Server_Viewdocs3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_server_viewdocs3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_server_viewdocs3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_server_viewdocs3(inputs)
	return ar_developerportal_integrationguide_server_viewdocs3(inputs)
});
export { developerportal_integrationguide_server_viewdocs3 as "developerPortal.integrationGuide.server.viewDocs" }