/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Seedphrase_Import1Inputs */

const en_login_seedphrase_import1 = /** @type {(inputs: Login_Seedphrase_Import1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Import Passport`)
};

const es_login_seedphrase_import1 = /** @type {(inputs: Login_Seedphrase_Import1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importar pasaporte`)
};

const de_login_seedphrase_import1 = /** @type {(inputs: Login_Seedphrase_Import1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ausweis importieren`)
};

const ar_login_seedphrase_import1 = /** @type {(inputs: Login_Seedphrase_Import1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استيراد جواز السفر`)
};

const fr_login_seedphrase_import1 = /** @type {(inputs: Login_Seedphrase_Import1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importer le passeport`)
};

const ko_login_seedphrase_import1 = /** @type {(inputs: Login_Seedphrase_Import1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`패스포트 가져오기`)
};

/**
* | output |
* | --- |
* | "Import Passport" |
*
* @param {Login_Seedphrase_Import1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_seedphrase_import1 = /** @type {((inputs?: Login_Seedphrase_Import1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Seedphrase_Import1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_seedphrase_import1(inputs)
	if (locale === "es") return es_login_seedphrase_import1(inputs)
	if (locale === "de") return de_login_seedphrase_import1(inputs)
	if (locale === "ar") return ar_login_seedphrase_import1(inputs)
	if (locale === "fr") return fr_login_seedphrase_import1(inputs)
	return ko_login_seedphrase_import1(inputs)
});
export { login_seedphrase_import1 as "login.seedPhrase.import" }