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

const de_login_loader_messages_3 = /** @type {(inputs: Login_Loader_Messages_3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Geheimer Sternenstaub wird entsperrt!`)
};

const ar_login_loader_messages_3 = /** @type {(inputs: Login_Loader_Messages_3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فتح غبار النجوم السري الخاص بك!`)
};

const fr_login_loader_messages_3 = /** @type {(inputs: Login_Loader_Messages_3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Déverrouillage de votre poussière d'étoile secrète !`)
};

const ko_login_loader_messages_3 = /** @type {(inputs: Login_Loader_Messages_3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`비밀 별가루 잠금 해제 중!`)
};

/**
* | output |
* | --- |
* | "Unlocking your secret stardust!" |
*
* @param {Login_Loader_Messages_3Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_loader_messages_3 = /** @type {((inputs?: Login_Loader_Messages_3Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Loader_Messages_3Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_loader_messages_3(inputs)
	if (locale === "es") return es_login_loader_messages_3(inputs)
	if (locale === "de") return de_login_loader_messages_3(inputs)
	if (locale === "ar") return ar_login_loader_messages_3(inputs)
	if (locale === "fr") return fr_login_loader_messages_3(inputs)
	return ko_login_loader_messages_3(inputs)
});
export { login_loader_messages_3 as "login.loader.messages.3" }