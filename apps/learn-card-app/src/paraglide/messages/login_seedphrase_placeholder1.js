/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Seedphrase_Placeholder1Inputs */

const en_login_seedphrase_placeholder1 = /** @type {(inputs: Login_Seedphrase_Placeholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Paste your seed phrase or key here...`)
};

const es_login_seedphrase_placeholder1 = /** @type {(inputs: Login_Seedphrase_Placeholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pega tu frase semilla o clave aquí...`)
};

const fr_login_seedphrase_placeholder1 = /** @type {(inputs: Login_Seedphrase_Placeholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Collez votre phrase de récupération ou clé ici...`)
};

const ar_login_seedphrase_placeholder1 = /** @type {(inputs: Login_Seedphrase_Placeholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الصق عبارة الاسترداد أو المفتاح هنا...`)
};

/**
* | output |
* | --- |
* | "Paste your seed phrase or key here..." |
*
* @param {Login_Seedphrase_Placeholder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_seedphrase_placeholder1 = /** @type {((inputs?: Login_Seedphrase_Placeholder1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Seedphrase_Placeholder1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_seedphrase_placeholder1(inputs)
	if (locale === "es") return es_login_seedphrase_placeholder1(inputs)
	if (locale === "fr") return fr_login_seedphrase_placeholder1(inputs)
	return ar_login_seedphrase_placeholder1(inputs)
});
export { login_seedphrase_placeholder1 as "login.seedPhrase.placeholder" }