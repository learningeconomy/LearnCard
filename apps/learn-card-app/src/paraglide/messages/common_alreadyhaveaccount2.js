/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_Alreadyhaveaccount2Inputs */

const en_common_alreadyhaveaccount2 = /** @type {(inputs: Common_Alreadyhaveaccount2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Already have an account?`)
};

const es_common_alreadyhaveaccount2 = /** @type {(inputs: Common_Alreadyhaveaccount2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Ya tienes una cuenta?`)
};

const fr_common_alreadyhaveaccount2 = /** @type {(inputs: Common_Alreadyhaveaccount2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous avez déjà un compte ?`)
};

const ar_common_alreadyhaveaccount2 = /** @type {(inputs: Common_Alreadyhaveaccount2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل لديك حساب بالفعل؟`)
};

/**
* | output |
* | --- |
* | "Already have an account?" |
*
* @param {Common_Alreadyhaveaccount2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_alreadyhaveaccount2 = /** @type {((inputs?: Common_Alreadyhaveaccount2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_Alreadyhaveaccount2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_alreadyhaveaccount2(inputs)
	if (locale === "es") return es_common_alreadyhaveaccount2(inputs)
	if (locale === "fr") return fr_common_alreadyhaveaccount2(inputs)
	return ar_common_alreadyhaveaccount2(inputs)
});
export { common_alreadyhaveaccount2 as "common.alreadyHaveAccount" }