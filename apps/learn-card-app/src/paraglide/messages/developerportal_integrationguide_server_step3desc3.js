/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Server_Step3desc3Inputs */

const en_developerportal_integrationguide_server_step3desc3 = /** @type {(inputs: Developerportal_Integrationguide_Server_Step3desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Install and initialize the LearnCard SDK in your backend application.`)
};

const es_developerportal_integrationguide_server_step3desc3 = /** @type {(inputs: Developerportal_Integrationguide_Server_Step3desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Instala e inicializa el SDK de LearnCard en tu aplicación backend.`)
};

const fr_developerportal_integrationguide_server_step3desc3 = /** @type {(inputs: Developerportal_Integrationguide_Server_Step3desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Installez et initialisez le SDK LearnCard dans votre application backend.`)
};

const ar_developerportal_integrationguide_server_step3desc3 = /** @type {(inputs: Developerportal_Integrationguide_Server_Step3desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم بتثبيت وتهيئة LearnCard SDK في تطبيق الخادم الخلفي الخاص بك.`)
};

/**
* | output |
* | --- |
* | "Install and initialize the LearnCard SDK in your backend application." |
*
* @param {Developerportal_Integrationguide_Server_Step3desc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_server_step3desc3 = /** @type {((inputs?: Developerportal_Integrationguide_Server_Step3desc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Server_Step3desc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_server_step3desc3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_server_step3desc3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_server_step3desc3(inputs)
	return ar_developerportal_integrationguide_server_step3desc3(inputs)
});
export { developerportal_integrationguide_server_step3desc3 as "developerPortal.integrationGuide.server.step3Desc" }