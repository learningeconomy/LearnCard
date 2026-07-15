/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Auth_Downloadscoutpass2Inputs */

const en_auth_downloadscoutpass2 = /** @type {(inputs: Auth_Downloadscoutpass2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You can also download ScoutPass on your smartphone or tablet:`)
};

const es_auth_downloadscoutpass2 = /** @type {(inputs: Auth_Downloadscoutpass2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`También puedes descargar ScoutPass en tu smartphone o tablet:`)
};

const fr_auth_downloadscoutpass2 = /** @type {(inputs: Auth_Downloadscoutpass2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous pouvez aussi télécharger ScoutPass sur votre smartphone ou tablette :`)
};

const ar_auth_downloadscoutpass2 = /** @type {(inputs: Auth_Downloadscoutpass2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You can also download ScoutPass on your smartphone or tablet:`)
};

/**
* | output |
* | --- |
* | "You can also download ScoutPass on your smartphone or tablet:" |
*
* @param {Auth_Downloadscoutpass2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const auth_downloadscoutpass2 = /** @type {((inputs?: Auth_Downloadscoutpass2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Downloadscoutpass2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_auth_downloadscoutpass2(inputs)
	if (locale === "es") return es_auth_downloadscoutpass2(inputs)
	if (locale === "fr") return fr_auth_downloadscoutpass2(inputs)
	return ar_auth_downloadscoutpass2(inputs)
});
export { auth_downloadscoutpass2 as "auth.downloadScoutPass" }