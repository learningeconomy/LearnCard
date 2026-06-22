/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Credentialtype_Roleexperienceplural4Inputs */

const en_consentflow_credentialtype_roleexperienceplural4 = /** @type {(inputs: Consentflow_Credentialtype_Roleexperienceplural4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Role Experiences`)
};

const es_consentflow_credentialtype_roleexperienceplural4 = /** @type {(inputs: Consentflow_Credentialtype_Roleexperienceplural4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Experiencias en el rol`)
};

const fr_consentflow_credentialtype_roleexperienceplural4 = /** @type {(inputs: Consentflow_Credentialtype_Roleexperienceplural4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expériences de rôle`)
};

const ar_consentflow_credentialtype_roleexperienceplural4 = /** @type {(inputs: Consentflow_Credentialtype_Roleexperienceplural4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خبرات في الدور`)
};

/**
* | output |
* | --- |
* | "Role Experiences" |
*
* @param {Consentflow_Credentialtype_Roleexperienceplural4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_credentialtype_roleexperienceplural4 = /** @type {((inputs?: Consentflow_Credentialtype_Roleexperienceplural4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Credentialtype_Roleexperienceplural4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_credentialtype_roleexperienceplural4(inputs)
	if (locale === "es") return es_consentflow_credentialtype_roleexperienceplural4(inputs)
	if (locale === "fr") return fr_consentflow_credentialtype_roleexperienceplural4(inputs)
	return ar_consentflow_credentialtype_roleexperienceplural4(inputs)
});
export { consentflow_credentialtype_roleexperienceplural4 as "consentFlow.credentialType.roleExperiencePlural" }