/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Credentialtype_Goals2Inputs */

const en_consentflow_credentialtype_goals2 = /** @type {(inputs: Consentflow_Credentialtype_Goals2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Goal`)
};

const es_consentflow_credentialtype_goals2 = /** @type {(inputs: Consentflow_Credentialtype_Goals2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Objetivo`)
};

const fr_consentflow_credentialtype_goals2 = /** @type {(inputs: Consentflow_Credentialtype_Goals2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Objectif`)
};

const ar_consentflow_credentialtype_goals2 = /** @type {(inputs: Consentflow_Credentialtype_Goals2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هدف`)
};

/**
* | output |
* | --- |
* | "Goal" |
*
* @param {Consentflow_Credentialtype_Goals2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_credentialtype_goals2 = /** @type {((inputs?: Consentflow_Credentialtype_Goals2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Credentialtype_Goals2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_credentialtype_goals2(inputs)
	if (locale === "es") return es_consentflow_credentialtype_goals2(inputs)
	if (locale === "fr") return fr_consentflow_credentialtype_goals2(inputs)
	return ar_consentflow_credentialtype_goals2(inputs)
});
export { consentflow_credentialtype_goals2 as "consentFlow.credentialType.goals" }