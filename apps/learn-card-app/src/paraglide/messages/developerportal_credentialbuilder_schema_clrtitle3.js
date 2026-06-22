/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Schema_Clrtitle3Inputs */

const en_developerportal_credentialbuilder_schema_clrtitle3 = /** @type {(inputs: Developerportal_Credentialbuilder_Schema_Clrtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`CLR 2.0 Credential`)
};

const es_developerportal_credentialbuilder_schema_clrtitle3 = /** @type {(inputs: Developerportal_Credentialbuilder_Schema_Clrtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credencial CLR 2.0`)
};

const fr_developerportal_credentialbuilder_schema_clrtitle3 = /** @type {(inputs: Developerportal_Credentialbuilder_Schema_Clrtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crédential CLR 2.0`)
};

const ar_developerportal_credentialbuilder_schema_clrtitle3 = /** @type {(inputs: Developerportal_Credentialbuilder_Schema_Clrtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اعتماد CLR 2.0`)
};

/**
* | output |
* | --- |
* | "CLR 2.0 Credential" |
*
* @param {Developerportal_Credentialbuilder_Schema_Clrtitle3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_schema_clrtitle3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Schema_Clrtitle3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Schema_Clrtitle3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_schema_clrtitle3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_schema_clrtitle3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_schema_clrtitle3(inputs)
	return ar_developerportal_credentialbuilder_schema_clrtitle3(inputs)
});
export { developerportal_credentialbuilder_schema_clrtitle3 as "developerPortal.credentialBuilder.schema.clrTitle" }