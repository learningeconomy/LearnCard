/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Schema_Customtitle3Inputs */

const en_developerportal_credentialbuilder_schema_customtitle3 = /** @type {(inputs: Developerportal_Credentialbuilder_Schema_Customtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Custom Credential Schema`)
};

const es_developerportal_credentialbuilder_schema_customtitle3 = /** @type {(inputs: Developerportal_Credentialbuilder_Schema_Customtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esquema de Credencial Personalizado`)
};

const fr_developerportal_credentialbuilder_schema_customtitle3 = /** @type {(inputs: Developerportal_Credentialbuilder_Schema_Customtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Schéma de Crédential Personnalisé`)
};

const ar_developerportal_credentialbuilder_schema_customtitle3 = /** @type {(inputs: Developerportal_Credentialbuilder_Schema_Customtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مخطط اعتماد مخصص`)
};

/**
* | output |
* | --- |
* | "Custom Credential Schema" |
*
* @param {Developerportal_Credentialbuilder_Schema_Customtitle3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_schema_customtitle3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Schema_Customtitle3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Schema_Customtitle3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_schema_customtitle3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_schema_customtitle3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_schema_customtitle3(inputs)
	return ar_developerportal_credentialbuilder_schema_customtitle3(inputs)
});
export { developerportal_credentialbuilder_schema_customtitle3 as "developerPortal.credentialBuilder.schema.customTitle" }