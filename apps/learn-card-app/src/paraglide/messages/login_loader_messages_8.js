/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Loader_Messages_8Inputs */

const en_login_loader_messages_8 = /** @type {(inputs: Login_Loader_Messages_8Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credentials loading with pizzazz!`)
};

const es_login_loader_messages_8 = /** @type {(inputs: Login_Loader_Messages_8Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Credenciales cargando con estilo!`)
};

const de_login_loader_messages_8 = /** @type {(inputs: Login_Loader_Messages_8Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nachweise laden mit Pep!`)
};

const ar_login_loader_messages_8 = /** @type {(inputs: Login_Loader_Messages_8Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحميل بيانات الاعتماد بأناقة!`)
};

const fr_login_loader_messages_8 = /** @type {(inputs: Login_Loader_Messages_8Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement des certifications avec panache !`)
};

const ko_login_loader_messages_8 = /** @type {(inputs: Login_Loader_Messages_8Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`자격 증명을 화려하게 로딩 중!`)
};

/**
* | output |
* | --- |
* | "Credentials loading with pizzazz!" |
*
* @param {Login_Loader_Messages_8Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_loader_messages_8 = /** @type {((inputs?: Login_Loader_Messages_8Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Loader_Messages_8Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_loader_messages_8(inputs)
	if (locale === "es") return es_login_loader_messages_8(inputs)
	if (locale === "de") return de_login_loader_messages_8(inputs)
	if (locale === "ar") return ar_login_loader_messages_8(inputs)
	if (locale === "fr") return fr_login_loader_messages_8(inputs)
	return ko_login_loader_messages_8(inputs)
});
export { login_loader_messages_8 as "login.loader.messages.8" }