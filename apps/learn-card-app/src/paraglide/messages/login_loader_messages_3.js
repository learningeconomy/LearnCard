/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Loader_Messages_3Inputs */

const en_login_loader_messages_3 = /** @type {(inputs: Login_Loader_Messages_3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unlocking your secret stardust!`)
};

const es_login_loader_messages_3 = /** @type {(inputs: Login_Loader_Messages_3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Desbloqueando tu polvo estelar secreto!`)
};

const fr_login_loader_messages_3 = /** @type {(inputs: Login_Loader_Messages_3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Déverrouillage de votre poussière d'étoile secrète !`)
};

const ar_login_loader_messages_3 = /** @type {(inputs: Login_Loader_Messages_3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فتح غبار النجوم السري الخاص بك!`)
};

/**
* | output |
* | --- |
* | "Unlocking your secret stardust!" |
*
* @param {Login_Loader_Messages_3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_loader_messages_3 = /** @type {((inputs?: Login_Loader_Messages_3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Loader_Messages_3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_loader_messages_3(inputs)
	if (locale === "es") return es_login_loader_messages_3(inputs)
	if (locale === "fr") return fr_login_loader_messages_3(inputs)
	return ar_login_loader_messages_3(inputs)
});
export { login_loader_messages_3 as "login.loader.messages.3" }