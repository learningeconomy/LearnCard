/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Loader_Messages_6Inputs */

const en_login_loader_messages_6 = /** @type {(inputs: Login_Loader_Messages_6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your digital treasure is near!`)
};

const es_login_loader_messages_6 = /** @type {(inputs: Login_Loader_Messages_6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Tu tesoro digital está cerca!`)
};

const de_login_loader_messages_6 = /** @type {(inputs: Login_Loader_Messages_6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dein digitaler Schatz ist nah!`)
};

const ar_login_loader_messages_6 = /** @type {(inputs: Login_Loader_Messages_6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`كنزك الرقمي قريب!`)
};

const fr_login_loader_messages_6 = /** @type {(inputs: Login_Loader_Messages_6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre trésor numérique est proche !`)
};

const ko_login_loader_messages_6 = /** @type {(inputs: Login_Loader_Messages_6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`디지털 보물이 가까이 있습니다!`)
};

/**
* | output |
* | --- |
* | "Your digital treasure is near!" |
*
* @param {Login_Loader_Messages_6Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_loader_messages_6 = /** @type {((inputs?: Login_Loader_Messages_6Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Loader_Messages_6Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_loader_messages_6(inputs)
	if (locale === "es") return es_login_loader_messages_6(inputs)
	if (locale === "de") return de_login_loader_messages_6(inputs)
	if (locale === "ar") return ar_login_loader_messages_6(inputs)
	if (locale === "fr") return fr_login_loader_messages_6(inputs)
	return ko_login_loader_messages_6(inputs)
});
export { login_loader_messages_6 as "login.loader.messages.6" }