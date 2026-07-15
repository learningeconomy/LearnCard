/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Userprofile_Connecthandler2Inputs */

const en_userprofile_connecthandler2 = /** @type {(inputs: Userprofile_Connecthandler2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connect Handler`)
};

const es_userprofile_connecthandler2 = /** @type {(inputs: Userprofile_Connecthandler2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestor de Conexión`)
};

const fr_userprofile_connecthandler2 = /** @type {(inputs: Userprofile_Connecthandler2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestionnaire de connexion`)
};

const ar_userprofile_connecthandler2 = /** @type {(inputs: Userprofile_Connecthandler2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ربط المعالج`)
};

/**
* | output |
* | --- |
* | "Connect Handler" |
*
* @param {Userprofile_Connecthandler2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const userprofile_connecthandler2 = /** @type {((inputs?: Userprofile_Connecthandler2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Userprofile_Connecthandler2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_userprofile_connecthandler2(inputs)
	if (locale === "es") return es_userprofile_connecthandler2(inputs)
	if (locale === "fr") return fr_userprofile_connecthandler2(inputs)
	return ar_userprofile_connecthandler2(inputs)
});
export { userprofile_connecthandler2 as "userProfile.connectHandler" }