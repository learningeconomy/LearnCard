/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Loader_Messages_4Inputs */

const en_login_loader_messages_4 = /** @type {(inputs: Login_Loader_Messages_4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Brewing your digital delights!`)
};

const es_login_loader_messages_4 = /** @type {(inputs: Login_Loader_Messages_4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Preparando tus delicias digitales!`)
};

const fr_login_loader_messages_4 = /** @type {(inputs: Login_Loader_Messages_4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Préparation de vos délices numériques !`)
};

const ar_login_loader_messages_4 = /** @type {(inputs: Login_Loader_Messages_4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحضير أشهى المأكولات الرقمية!`)
};

/**
* | output |
* | --- |
* | "Brewing your digital delights!" |
*
* @param {Login_Loader_Messages_4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_loader_messages_4 = /** @type {((inputs?: Login_Loader_Messages_4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Loader_Messages_4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_loader_messages_4(inputs)
	if (locale === "es") return es_login_loader_messages_4(inputs)
	if (locale === "fr") return fr_login_loader_messages_4(inputs)
	return ar_login_loader_messages_4(inputs)
});
export { login_loader_messages_4 as "login.loader.messages.4" }