/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Loader_Messages_2Inputs */

const en_login_loader_messages_2 = /** @type {(inputs: Login_Loader_Messages_2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fetching your badge brilliance!`)
};

const es_login_loader_messages_2 = /** @type {(inputs: Login_Loader_Messages_2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Obteniendo el brillo de tus insignias!`)
};

const fr_login_loader_messages_2 = /** @type {(inputs: Login_Loader_Messages_2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Récupération de l'éclat de vos badges !`)
};

const ar_login_loader_messages_2 = /** @type {(inputs: Login_Loader_Messages_2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جلب تألق شاراتك!`)
};

/**
* | output |
* | --- |
* | "Fetching your badge brilliance!" |
*
* @param {Login_Loader_Messages_2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_loader_messages_2 = /** @type {((inputs?: Login_Loader_Messages_2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Loader_Messages_2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_loader_messages_2(inputs)
	if (locale === "es") return es_login_loader_messages_2(inputs)
	if (locale === "fr") return fr_login_loader_messages_2(inputs)
	return ar_login_loader_messages_2(inputs)
});
export { login_loader_messages_2 as "login.loader.messages.2" }