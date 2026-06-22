/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Credentialtype_Skillplural3Inputs */

const en_consentflow_credentialtype_skillplural3 = /** @type {(inputs: Consentflow_Credentialtype_Skillplural3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Skills`)
};

const es_consentflow_credentialtype_skillplural3 = /** @type {(inputs: Consentflow_Credentialtype_Skillplural3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Habilidades`)
};

const fr_consentflow_credentialtype_skillplural3 = /** @type {(inputs: Consentflow_Credentialtype_Skillplural3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compétences`)
};

const ar_consentflow_credentialtype_skillplural3 = /** @type {(inputs: Consentflow_Credentialtype_Skillplural3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المهارات`)
};

/**
* | output |
* | --- |
* | "Skills" |
*
* @param {Consentflow_Credentialtype_Skillplural3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_credentialtype_skillplural3 = /** @type {((inputs?: Consentflow_Credentialtype_Skillplural3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Credentialtype_Skillplural3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_credentialtype_skillplural3(inputs)
	if (locale === "es") return es_consentflow_credentialtype_skillplural3(inputs)
	if (locale === "fr") return fr_consentflow_credentialtype_skillplural3(inputs)
	return ar_consentflow_credentialtype_skillplural3(inputs)
});
export { consentflow_credentialtype_skillplural3 as "consentFlow.credentialType.skillPlural" }