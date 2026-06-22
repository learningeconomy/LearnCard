/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Loader_Messages_0Inputs */

const en_login_loader_messages_0 = /** @type {(inputs: Login_Loader_Messages_0Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credentials coming right up!`)
};

const es_login_loader_messages_0 = /** @type {(inputs: Login_Loader_Messages_0Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Credenciales en camino!`)
};

const fr_login_loader_messages_0 = /** @type {(inputs: Login_Loader_Messages_0Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vos certifications arrivent !`)
};

const ar_login_loader_messages_0 = /** @type {(inputs: Login_Loader_Messages_0Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بيانات الاعتماد في الطريق!`)
};

/**
* | output |
* | --- |
* | "Credentials coming right up!" |
*
* @param {Login_Loader_Messages_0Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_loader_messages_0 = /** @type {((inputs?: Login_Loader_Messages_0Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Loader_Messages_0Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_loader_messages_0(inputs)
	if (locale === "es") return es_login_loader_messages_0(inputs)
	if (locale === "fr") return fr_login_loader_messages_0(inputs)
	return ar_login_loader_messages_0(inputs)
});
export { login_loader_messages_0 as "login.loader.messages.0" }