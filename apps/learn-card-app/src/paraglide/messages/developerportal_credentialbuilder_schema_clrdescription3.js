/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Schema_Clrdescription3Inputs */

const en_developerportal_credentialbuilder_schema_clrdescription3 = /** @type {(inputs: Developerportal_Credentialbuilder_Schema_Clrdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Comprehensive Learner Record — a multi-achievement transcript credential.`)
};

const es_developerportal_credentialbuilder_schema_clrdescription3 = /** @type {(inputs: Developerportal_Credentialbuilder_Schema_Clrdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Registro Integral de Aprendizaje: una credencial de transcripción con múltiples logros.`)
};

const fr_developerportal_credentialbuilder_schema_clrdescription3 = /** @type {(inputs: Developerportal_Credentialbuilder_Schema_Clrdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Registre d'apprentissage complet — un relevé de notes avec plusieurs réalisations.`)
};

const ar_developerportal_credentialbuilder_schema_clrdescription3 = /** @type {(inputs: Developerportal_Credentialbuilder_Schema_Clrdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سجل تعلم شامل — اعتماد كشف درجات متعدد الإنجازات.`)
};

/**
* | output |
* | --- |
* | "Comprehensive Learner Record — a multi-achievement transcript credential." |
*
* @param {Developerportal_Credentialbuilder_Schema_Clrdescription3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_schema_clrdescription3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Schema_Clrdescription3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Schema_Clrdescription3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_schema_clrdescription3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_schema_clrdescription3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_schema_clrdescription3(inputs)
	return ar_developerportal_credentialbuilder_schema_clrdescription3(inputs)
});
export { developerportal_credentialbuilder_schema_clrdescription3 as "developerPortal.credentialBuilder.schema.clrDescription" }