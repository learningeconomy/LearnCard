/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ version: NonNullable<unknown> }} Auth_Updatever1Inputs */

const en_auth_updatever1 = /** @type {(inputs: Auth_Updatever1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Update to ${i?.version}`)
};

const es_auth_updatever1 = /** @type {(inputs: Auth_Updatever1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Actualizar a ${i?.version}`)
};

const fr_auth_updatever1 = /** @type {(inputs: Auth_Updatever1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Mettre à jour vers ${i?.version}`)
};

const ar_auth_updatever1 = /** @type {(inputs: Auth_Updatever1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Update to ${i?.version}`)
};

/**
* | output |
* | --- |
* | "Update to {version}" |
*
* @param {Auth_Updatever1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const auth_updatever1 = /** @type {((inputs: Auth_Updatever1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Updatever1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_auth_updatever1(inputs)
	if (locale === "es") return es_auth_updatever1(inputs)
	if (locale === "fr") return fr_auth_updatever1(inputs)
	return ar_auth_updatever1(inputs)
});
export { auth_updatever1 as "auth.updateVer" }