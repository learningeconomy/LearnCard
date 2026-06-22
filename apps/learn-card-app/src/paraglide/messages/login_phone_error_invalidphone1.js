/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Phone_Error_Invalidphone1Inputs */

const en_login_phone_error_invalidphone1 = /** @type {(inputs: Login_Phone_Error_Invalidphone1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Phone is required!`)
};

const es_login_phone_error_invalidphone1 = /** @type {(inputs: Login_Phone_Error_Invalidphone1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Se requiere teléfono!`)
};

const fr_login_phone_error_invalidphone1 = /** @type {(inputs: Login_Phone_Error_Invalidphone1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le numéro de téléphone est requis !`)
};

const ar_login_phone_error_invalidphone1 = /** @type {(inputs: Login_Phone_Error_Invalidphone1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رقم الهاتف مطلوب!`)
};

/**
* | output |
* | --- |
* | "Phone is required!" |
*
* @param {Login_Phone_Error_Invalidphone1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_phone_error_invalidphone1 = /** @type {((inputs?: Login_Phone_Error_Invalidphone1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Phone_Error_Invalidphone1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_phone_error_invalidphone1(inputs)
	if (locale === "es") return es_login_phone_error_invalidphone1(inputs)
	if (locale === "fr") return fr_login_phone_error_invalidphone1(inputs)
	return ar_login_phone_error_invalidphone1(inputs)
});
export { login_phone_error_invalidphone1 as "login.phone.error.invalidPhone" }