/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Schema_Jsononlybutton4Inputs */

const en_developerportal_credentialbuilder_schema_jsononlybutton4 = /** @type {(inputs: Developerportal_Credentialbuilder_Schema_Jsononlybutton4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Open JSON Editor`)
};

const es_developerportal_credentialbuilder_schema_jsononlybutton4 = /** @type {(inputs: Developerportal_Credentialbuilder_Schema_Jsononlybutton4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abrir Editor JSON`)
};

const fr_developerportal_credentialbuilder_schema_jsononlybutton4 = /** @type {(inputs: Developerportal_Credentialbuilder_Schema_Jsononlybutton4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ouvrir l'Éditeur JSON`)
};

const ar_developerportal_credentialbuilder_schema_jsononlybutton4 = /** @type {(inputs: Developerportal_Credentialbuilder_Schema_Jsononlybutton4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فتح محرر JSON`)
};

/**
* | output |
* | --- |
* | "Open JSON Editor" |
*
* @param {Developerportal_Credentialbuilder_Schema_Jsononlybutton4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_schema_jsononlybutton4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Schema_Jsononlybutton4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Schema_Jsononlybutton4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_schema_jsononlybutton4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_schema_jsononlybutton4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_schema_jsononlybutton4(inputs)
	return ar_developerportal_credentialbuilder_schema_jsononlybutton4(inputs)
});
export { developerportal_credentialbuilder_schema_jsononlybutton4 as "developerPortal.credentialBuilder.schema.jsonOnlyButton" }