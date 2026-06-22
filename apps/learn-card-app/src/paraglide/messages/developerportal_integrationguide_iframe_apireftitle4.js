/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Iframe_Apireftitle4Inputs */

const en_developerportal_integrationguide_iframe_apireftitle4 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Apireftitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Full API Reference`)
};

const es_developerportal_integrationguide_iframe_apireftitle4 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Apireftitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Referencia Completa de la API`)
};

const fr_developerportal_integrationguide_iframe_apireftitle4 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Apireftitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Référence Complète de l'API`)
};

const ar_developerportal_integrationguide_iframe_apireftitle4 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Apireftitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مرجع API الكامل`)
};

/**
* | output |
* | --- |
* | "Full API Reference" |
*
* @param {Developerportal_Integrationguide_Iframe_Apireftitle4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_iframe_apireftitle4 = /** @type {((inputs?: Developerportal_Integrationguide_Iframe_Apireftitle4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Iframe_Apireftitle4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_iframe_apireftitle4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_iframe_apireftitle4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_iframe_apireftitle4(inputs)
	return ar_developerportal_integrationguide_iframe_apireftitle4(inputs)
});
export { developerportal_integrationguide_iframe_apireftitle4 as "developerPortal.integrationGuide.iframe.apiRefTitle" }