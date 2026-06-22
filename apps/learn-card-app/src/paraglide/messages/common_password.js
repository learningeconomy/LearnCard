/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_PasswordInputs */

const en_common_password = /** @type {(inputs: Common_PasswordInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Password`)
};

const es_common_password = /** @type {(inputs: Common_PasswordInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contraseña`)
};

const fr_common_password = /** @type {(inputs: Common_PasswordInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mot de passe`)
};

const ar_common_password = /** @type {(inputs: Common_PasswordInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`كلمة المرور`)
};

/**
* | output |
* | --- |
* | "Password" |
*
* @param {Common_PasswordInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_password = /** @type {((inputs?: Common_PasswordInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_PasswordInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_password(inputs)
	if (locale === "es") return es_common_password(inputs)
	if (locale === "fr") return fr_common_password(inputs)
	return ar_common_password(inputs)
});
export { common_password as "common.password" }