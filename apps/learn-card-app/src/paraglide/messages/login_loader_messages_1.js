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

const de_login_loader_messages_1 = /** @type {(inputs: Login_Loader_Messages_1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Zauberstab für Nachweise wird geschwungen!`)
};

const ar_login_loader_messages_1 = /** @type {(inputs: Login_Loader_Messages_1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التلويح بعصا الاعتماد السحرية!`)
};

const fr_login_loader_messages_1 = /** @type {(inputs: Login_Loader_Messages_1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Agitation de la baguette magique !`)
};

const ko_login_loader_messages_1 = /** @type {(inputs: Login_Loader_Messages_1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`마법의 자격 증명 지팡이를 흔드는 중!`)
};

/**
* | output |
* | --- |
* | "Waving a magic credential wand!" |
*
* @param {Login_Loader_Messages_1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_loader_messages_1 = /** @type {((inputs?: Login_Loader_Messages_1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Loader_Messages_1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_loader_messages_1(inputs)
	if (locale === "es") return es_login_loader_messages_1(inputs)
	if (locale === "de") return de_login_loader_messages_1(inputs)
	if (locale === "ar") return ar_login_loader_messages_1(inputs)
	if (locale === "fr") return fr_login_loader_messages_1(inputs)
	return ko_login_loader_messages_1(inputs)
});
export { login_loader_messages_1 as "login.loader.messages.1" }