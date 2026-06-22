/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Credentialtype_Worklifebalanceplural5Inputs */

const en_consentflow_credentialtype_worklifebalanceplural5 = /** @type {(inputs: Consentflow_Credentialtype_Worklifebalanceplural5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Work Life Balance`)
};

const es_consentflow_credentialtype_worklifebalanceplural5 = /** @type {(inputs: Consentflow_Credentialtype_Worklifebalanceplural5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Equilibrio trabajo-vida`)
};

const fr_consentflow_credentialtype_worklifebalanceplural5 = /** @type {(inputs: Consentflow_Credentialtype_Worklifebalanceplural5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Équilibre travail-vie`)
};

const ar_consentflow_credentialtype_worklifebalanceplural5 = /** @type {(inputs: Consentflow_Credentialtype_Worklifebalanceplural5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التوازن بين العمل والحياة`)
};

/**
* | output |
* | --- |
* | "Work Life Balance" |
*
* @param {Consentflow_Credentialtype_Worklifebalanceplural5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_credentialtype_worklifebalanceplural5 = /** @type {((inputs?: Consentflow_Credentialtype_Worklifebalanceplural5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Credentialtype_Worklifebalanceplural5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_credentialtype_worklifebalanceplural5(inputs)
	if (locale === "es") return es_consentflow_credentialtype_worklifebalanceplural5(inputs)
	if (locale === "fr") return fr_consentflow_credentialtype_worklifebalanceplural5(inputs)
	return ar_consentflow_credentialtype_worklifebalanceplural5(inputs)
});
export { consentflow_credentialtype_worklifebalanceplural5 as "consentFlow.credentialType.workLifeBalancePlural" }