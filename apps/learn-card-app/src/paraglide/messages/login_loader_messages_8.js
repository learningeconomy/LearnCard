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

const fr_login_loader_messages_8 = /** @type {(inputs: Login_Loader_Messages_8Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement des certifications avec panache !`)
};

const ar_login_loader_messages_8 = /** @type {(inputs: Login_Loader_Messages_8Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحميل بيانات الاعتماد بأناقة!`)
};

/**
* | output |
* | --- |
* | "Credentials loading with pizzazz!" |
*
* @param {Login_Loader_Messages_8Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_loader_messages_8 = /** @type {((inputs?: Login_Loader_Messages_8Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Loader_Messages_8Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_loader_messages_8(inputs)
	if (locale === "es") return es_login_loader_messages_8(inputs)
	if (locale === "fr") return fr_login_loader_messages_8(inputs)
	return ar_login_loader_messages_8(inputs)
});
export { login_loader_messages_8 as "login.loader.messages.8" }