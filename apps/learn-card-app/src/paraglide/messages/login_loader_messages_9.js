/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Loader_Messages_9Inputs */

const en_login_loader_messages_9 = /** @type {(inputs: Login_Loader_Messages_9Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Get ready for credential spark!`)
};

const es_login_loader_messages_9 = /** @type {(inputs: Login_Loader_Messages_9Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Prepárate para la chispa de credenciales!`)
};

const fr_login_loader_messages_9 = /** @type {(inputs: Login_Loader_Messages_9Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Préparez-vous pour l'étincelle des certifications !`)
};

const ar_login_loader_messages_9 = /** @type {(inputs: Login_Loader_Messages_9Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استعد لشرارة الاعتماد!`)
};

/**
* | output |
* | --- |
* | "Get ready for credential spark!" |
*
* @param {Login_Loader_Messages_9Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_loader_messages_9 = /** @type {((inputs?: Login_Loader_Messages_9Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Loader_Messages_9Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_loader_messages_9(inputs)
	if (locale === "es") return es_login_loader_messages_9(inputs)
	if (locale === "fr") return fr_login_loader_messages_9(inputs)
	return ar_login_loader_messages_9(inputs)
});
export { login_loader_messages_9 as "login.loader.messages.9" }