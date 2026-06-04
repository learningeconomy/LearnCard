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

const de_login_loader_messages_0 = /** @type {(inputs: Login_Loader_Messages_0Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nachweise kommen sofort!`)
};

const ar_login_loader_messages_0 = /** @type {(inputs: Login_Loader_Messages_0Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بيانات الاعتماد في الطريق!`)
};

const fr_login_loader_messages_0 = /** @type {(inputs: Login_Loader_Messages_0Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vos certifications arrivent !`)
};

const ko_login_loader_messages_0 = /** @type {(inputs: Login_Loader_Messages_0Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`자격 증명이 곧 도착합니다!`)
};

/**
* | output |
* | --- |
* | "Credentials coming right up!" |
*
* @param {Login_Loader_Messages_0Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_loader_messages_0 = /** @type {((inputs?: Login_Loader_Messages_0Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Loader_Messages_0Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_loader_messages_0(inputs)
	if (locale === "es") return es_login_loader_messages_0(inputs)
	if (locale === "de") return de_login_loader_messages_0(inputs)
	if (locale === "ar") return ar_login_loader_messages_0(inputs)
	if (locale === "fr") return fr_login_loader_messages_0(inputs)
	return ko_login_loader_messages_0(inputs)
});
export { login_loader_messages_0 as "login.loader.messages.0" }