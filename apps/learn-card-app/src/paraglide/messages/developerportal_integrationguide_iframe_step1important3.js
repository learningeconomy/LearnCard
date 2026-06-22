/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Iframe_Step1important3Inputs */

const en_developerportal_integrationguide_iframe_step1important3 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step1important3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your server must include these response headers:`)
};

const es_developerportal_integrationguide_iframe_step1important3 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step1important3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu servidor debe incluir estos encabezados de respuesta:`)
};

const fr_developerportal_integrationguide_iframe_step1important3 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step1important3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre serveur doit inclure ces en-têtes de réponse :`)
};

const ar_developerportal_integrationguide_iframe_step1important3 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Step1important3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يجب أن يتضمن خادمك رؤوس الاستجابة هذه:`)
};

/**
* | output |
* | --- |
* | "Your server must include these response headers:" |
*
* @param {Developerportal_Integrationguide_Iframe_Step1important3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_iframe_step1important3 = /** @type {((inputs?: Developerportal_Integrationguide_Iframe_Step1important3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Iframe_Step1important3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_iframe_step1important3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_iframe_step1important3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_iframe_step1important3(inputs)
	return ar_developerportal_integrationguide_iframe_step1important3(inputs)
});
export { developerportal_integrationguide_iframe_step1important3 as "developerPortal.integrationGuide.iframe.step1Important" }