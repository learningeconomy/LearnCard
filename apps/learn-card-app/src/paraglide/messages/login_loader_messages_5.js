/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Loader_Messages_5Inputs */

const en_login_loader_messages_5 = /** @type {(inputs: Login_Loader_Messages_5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Summoning your credential superpowers!`)
};

const es_login_loader_messages_5 = /** @type {(inputs: Login_Loader_Messages_5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Invocando tus superpoderes de credenciales!`)
};

const fr_login_loader_messages_5 = /** @type {(inputs: Login_Loader_Messages_5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invocation de vos super-pouvoirs de certification !`)
};

const ar_login_loader_messages_5 = /** @type {(inputs: Login_Loader_Messages_5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استدعاء قوى الاعتماد الخارقة!`)
};

/**
* | output |
* | --- |
* | "Summoning your credential superpowers!" |
*
* @param {Login_Loader_Messages_5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_loader_messages_5 = /** @type {((inputs?: Login_Loader_Messages_5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Loader_Messages_5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_loader_messages_5(inputs)
	if (locale === "es") return es_login_loader_messages_5(inputs)
	if (locale === "fr") return fr_login_loader_messages_5(inputs)
	return ar_login_loader_messages_5(inputs)
});
export { login_loader_messages_5 as "login.loader.messages.5" }