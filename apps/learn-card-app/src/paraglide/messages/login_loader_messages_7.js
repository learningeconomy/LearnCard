/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Loader_Messages_7Inputs */

const en_login_loader_messages_7 = /** @type {(inputs: Login_Loader_Messages_7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preparing your badge bonanza!`)
};

const es_login_loader_messages_7 = /** @type {(inputs: Login_Loader_Messages_7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Preparando tu colección de insignias!`)
};

const de_login_loader_messages_7 = /** @type {(inputs: Login_Loader_Messages_7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abzeichen-Bonanza wird vorbereitet!`)
};

const ar_login_loader_messages_7 = /** @type {(inputs: Login_Loader_Messages_7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحضير مجموعة الشارات!`)
};

const fr_login_loader_messages_7 = /** @type {(inputs: Login_Loader_Messages_7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Préparation de votre collection de badges !`)
};

const ko_login_loader_messages_7 = /** @type {(inputs: Login_Loader_Messages_7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`배지 보물창고 준비 중!`)
};

/**
* | output |
* | --- |
* | "Preparing your badge bonanza!" |
*
* @param {Login_Loader_Messages_7Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_loader_messages_7 = /** @type {((inputs?: Login_Loader_Messages_7Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Loader_Messages_7Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_loader_messages_7(inputs)
	if (locale === "es") return es_login_loader_messages_7(inputs)
	if (locale === "de") return de_login_loader_messages_7(inputs)
	if (locale === "ar") return ar_login_loader_messages_7(inputs)
	if (locale === "fr") return fr_login_loader_messages_7(inputs)
	return ko_login_loader_messages_7(inputs)
});
export { login_loader_messages_7 as "login.loader.messages.7" }