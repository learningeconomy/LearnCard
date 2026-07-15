/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Auth_Linkdevice1Inputs */

const en_auth_linkdevice1 = /** @type {(inputs: Auth_Linkdevice1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Link a Device`)
};

const es_auth_linkdevice1 = /** @type {(inputs: Auth_Linkdevice1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vincular un Dispositivo`)
};

const fr_auth_linkdevice1 = /** @type {(inputs: Auth_Linkdevice1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lier un appareil`)
};

const ar_auth_linkdevice1 = /** @type {(inputs: Auth_Linkdevice1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ربط جهاز`)
};

/**
* | output |
* | --- |
* | "Link a Device" |
*
* @param {Auth_Linkdevice1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const auth_linkdevice1 = /** @type {((inputs?: Auth_Linkdevice1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Linkdevice1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_auth_linkdevice1(inputs)
	if (locale === "es") return es_auth_linkdevice1(inputs)
	if (locale === "fr") return fr_auth_linkdevice1(inputs)
	return ar_auth_linkdevice1(inputs)
});
export { auth_linkdevice1 as "auth.linkDevice" }