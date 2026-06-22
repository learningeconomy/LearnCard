/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Credentialtype_Socialbadgeplural4Inputs */

const en_consentflow_credentialtype_socialbadgeplural4 = /** @type {(inputs: Consentflow_Credentialtype_Socialbadgeplural4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Social Badges`)
};

const es_consentflow_credentialtype_socialbadgeplural4 = /** @type {(inputs: Consentflow_Credentialtype_Socialbadgeplural4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Insignias sociales`)
};

const fr_consentflow_credentialtype_socialbadgeplural4 = /** @type {(inputs: Consentflow_Credentialtype_Socialbadgeplural4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Badges sociaux`)
};

const ar_consentflow_credentialtype_socialbadgeplural4 = /** @type {(inputs: Consentflow_Credentialtype_Socialbadgeplural4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الشارات الاجتماعية`)
};

/**
* | output |
* | --- |
* | "Social Badges" |
*
* @param {Consentflow_Credentialtype_Socialbadgeplural4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_credentialtype_socialbadgeplural4 = /** @type {((inputs?: Consentflow_Credentialtype_Socialbadgeplural4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Credentialtype_Socialbadgeplural4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_credentialtype_socialbadgeplural4(inputs)
	if (locale === "es") return es_consentflow_credentialtype_socialbadgeplural4(inputs)
	if (locale === "fr") return fr_consentflow_credentialtype_socialbadgeplural4(inputs)
	return ar_consentflow_credentialtype_socialbadgeplural4(inputs)
});
export { consentflow_credentialtype_socialbadgeplural4 as "consentFlow.credentialType.socialBadgePlural" }