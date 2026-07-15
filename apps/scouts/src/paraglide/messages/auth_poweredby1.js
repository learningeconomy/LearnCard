/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Auth_Poweredby1Inputs */

const en_auth_poweredby1 = /** @type {(inputs: Auth_Poweredby1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`powered by`)
};

const es_auth_poweredby1 = /** @type {(inputs: Auth_Poweredby1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`desarrollado por`)
};

const fr_auth_poweredby1 = /** @type {(inputs: Auth_Poweredby1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`propulsé par`)
};

const ar_auth_poweredby1 = /** @type {(inputs: Auth_Poweredby1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مدعوم من`)
};

/**
* | output |
* | --- |
* | "powered by" |
*
* @param {Auth_Poweredby1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const auth_poweredby1 = /** @type {((inputs?: Auth_Poweredby1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Poweredby1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_auth_poweredby1(inputs)
	if (locale === "es") return es_auth_poweredby1(inputs)
	if (locale === "fr") return fr_auth_poweredby1(inputs)
	return ar_auth_poweredby1(inputs)
});
export { auth_poweredby1 as "auth.poweredBy" }