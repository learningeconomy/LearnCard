/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Loader_Messages_1Inputs */

const en_login_loader_messages_1 = /** @type {(inputs: Login_Loader_Messages_1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Waving a magic credential wand!`)
};

const es_login_loader_messages_1 = /** @type {(inputs: Login_Loader_Messages_1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Agitando la varita mágica de credenciales!`)
};

const fr_login_loader_messages_1 = /** @type {(inputs: Login_Loader_Messages_1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Agitation de la baguette magique !`)
};

const ar_login_loader_messages_1 = /** @type {(inputs: Login_Loader_Messages_1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التلويح بعصا الاعتماد السحرية!`)
};

/**
* | output |
* | --- |
* | "Waving a magic credential wand!" |
*
* @param {Login_Loader_Messages_1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_loader_messages_1 = /** @type {((inputs?: Login_Loader_Messages_1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Loader_Messages_1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_loader_messages_1(inputs)
	if (locale === "es") return es_login_loader_messages_1(inputs)
	if (locale === "fr") return fr_login_loader_messages_1(inputs)
	return ar_login_loader_messages_1(inputs)
});
export { login_loader_messages_1 as "login.loader.messages.1" }