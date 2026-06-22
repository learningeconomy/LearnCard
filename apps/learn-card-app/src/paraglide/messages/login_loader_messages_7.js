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

const fr_login_loader_messages_7 = /** @type {(inputs: Login_Loader_Messages_7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Préparation de votre collection de badges !`)
};

const ar_login_loader_messages_7 = /** @type {(inputs: Login_Loader_Messages_7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحضير مجموعة الشارات!`)
};

/**
* | output |
* | --- |
* | "Preparing your badge bonanza!" |
*
* @param {Login_Loader_Messages_7Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_loader_messages_7 = /** @type {((inputs?: Login_Loader_Messages_7Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Loader_Messages_7Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_loader_messages_7(inputs)
	if (locale === "es") return es_login_loader_messages_7(inputs)
	if (locale === "fr") return fr_login_loader_messages_7(inputs)
	return ar_login_loader_messages_7(inputs)
});
export { login_loader_messages_7 as "login.loader.messages.7" }