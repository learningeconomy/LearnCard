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

const fr_login_seedphrase_import1 = /** @type {(inputs: Login_Seedphrase_Import1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importer le passeport`)
};

const ar_login_seedphrase_import1 = /** @type {(inputs: Login_Seedphrase_Import1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استيراد جواز السفر`)
};

/**
* | output |
* | --- |
* | "Import Passport" |
*
* @param {Login_Seedphrase_Import1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_seedphrase_import1 = /** @type {((inputs?: Login_Seedphrase_Import1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Seedphrase_Import1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_seedphrase_import1(inputs)
	if (locale === "es") return es_login_seedphrase_import1(inputs)
	if (locale === "fr") return fr_login_seedphrase_import1(inputs)
	return ar_login_seedphrase_import1(inputs)
});
export { login_seedphrase_import1 as "login.seedPhrase.import" }