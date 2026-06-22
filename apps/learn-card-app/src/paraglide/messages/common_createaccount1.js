/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_Createaccount1Inputs */

const en_common_createaccount1 = /** @type {(inputs: Common_Createaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Account`)
};

const es_common_createaccount1 = /** @type {(inputs: Common_Createaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear cuenta`)
};

const fr_common_createaccount1 = /** @type {(inputs: Common_Createaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer un compte`)
};

const ar_common_createaccount1 = /** @type {(inputs: Common_Createaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء حساب`)
};

/**
* | output |
* | --- |
* | "Create Account" |
*
* @param {Common_Createaccount1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_createaccount1 = /** @type {((inputs?: Common_Createaccount1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_Createaccount1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_createaccount1(inputs)
	if (locale === "es") return es_common_createaccount1(inputs)
	if (locale === "fr") return fr_common_createaccount1(inputs)
	return ar_common_createaccount1(inputs)
});
export { common_createaccount1 as "common.createAccount" }