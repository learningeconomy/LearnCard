/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Auth_Nodevicekey2Inputs */

const en_auth_nodevicekey2 = /** @type {(inputs: Auth_Nodevicekey2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No device key available`)
};

const es_auth_nodevicekey2 = /** @type {(inputs: Auth_Nodevicekey2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No hay clave de dispositivo disponible`)
};

const fr_auth_nodevicekey2 = /** @type {(inputs: Auth_Nodevicekey2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune clé d'appareil disponible`)
};

const ar_auth_nodevicekey2 = /** @type {(inputs: Auth_Nodevicekey2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No device key available`)
};

/**
* | output |
* | --- |
* | "No device key available" |
*
* @param {Auth_Nodevicekey2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const auth_nodevicekey2 = /** @type {((inputs?: Auth_Nodevicekey2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Nodevicekey2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_auth_nodevicekey2(inputs)
	if (locale === "es") return es_auth_nodevicekey2(inputs)
	if (locale === "fr") return fr_auth_nodevicekey2(inputs)
	return ar_auth_nodevicekey2(inputs)
});
export { auth_nodevicekey2 as "auth.noDeviceKey" }