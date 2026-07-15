/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Haveaccount2Inputs */

const en_consentflow_haveaccount2 = /** @type {(inputs: Consentflow_Haveaccount2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Have an account?`)
};

const es_consentflow_haveaccount2 = /** @type {(inputs: Consentflow_Haveaccount2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Tienes una cuenta?`)
};

const fr_consentflow_haveaccount2 = /** @type {(inputs: Consentflow_Haveaccount2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous avez un compte ?`)
};

const ar_consentflow_haveaccount2 = /** @type {(inputs: Consentflow_Haveaccount2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Have an account?`)
};

/**
* | output |
* | --- |
* | "Have an account?" |
*
* @param {Consentflow_Haveaccount2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_haveaccount2 = /** @type {((inputs?: Consentflow_Haveaccount2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Haveaccount2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_haveaccount2(inputs)
	if (locale === "es") return es_consentflow_haveaccount2(inputs)
	if (locale === "fr") return fr_consentflow_haveaccount2(inputs)
	return ar_consentflow_haveaccount2(inputs)
});
export { consentflow_haveaccount2 as "consentFlow.haveAccount" }