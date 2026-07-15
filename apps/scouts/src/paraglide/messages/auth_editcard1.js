/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Auth_Editcard1Inputs */

const en_auth_editcard1 = /** @type {(inputs: Auth_Editcard1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit Contact Card`)
};

const es_auth_editcard1 = /** @type {(inputs: Auth_Editcard1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar Tarjeta de Contacto`)
};

const fr_auth_editcard1 = /** @type {(inputs: Auth_Editcard1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier la carte de contact`)
};

const ar_auth_editcard1 = /** @type {(inputs: Auth_Editcard1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit Contact Card`)
};

/**
* | output |
* | --- |
* | "Edit Contact Card" |
*
* @param {Auth_Editcard1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const auth_editcard1 = /** @type {((inputs?: Auth_Editcard1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Editcard1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_auth_editcard1(inputs)
	if (locale === "es") return es_auth_editcard1(inputs)
	if (locale === "fr") return fr_auth_editcard1(inputs)
	return ar_auth_editcard1(inputs)
});
export { auth_editcard1 as "auth.editCard" }