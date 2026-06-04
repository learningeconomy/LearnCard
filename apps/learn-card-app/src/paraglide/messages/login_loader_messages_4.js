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

const de_login_loader_messages_4 = /** @type {(inputs: Login_Loader_Messages_4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Digitale Köstlichkeiten werden gebraut!`)
};

const ar_login_loader_messages_4 = /** @type {(inputs: Login_Loader_Messages_4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحضير أشهى المأكولات الرقمية!`)
};

const fr_login_loader_messages_4 = /** @type {(inputs: Login_Loader_Messages_4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Préparation de vos délices numériques !`)
};

const ko_login_loader_messages_4 = /** @type {(inputs: Login_Loader_Messages_4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`디지털 즐거움을 준비하는 중!`)
};

/**
* | output |
* | --- |
* | "Brewing your digital delights!" |
*
* @param {Login_Loader_Messages_4Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_loader_messages_4 = /** @type {((inputs?: Login_Loader_Messages_4Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Loader_Messages_4Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_loader_messages_4(inputs)
	if (locale === "es") return es_login_loader_messages_4(inputs)
	if (locale === "de") return de_login_loader_messages_4(inputs)
	if (locale === "ar") return ar_login_loader_messages_4(inputs)
	if (locale === "fr") return fr_login_loader_messages_4(inputs)
	return ko_login_loader_messages_4(inputs)
});
export { login_loader_messages_4 as "login.loader.messages.4" }