/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Auth_Upgradeacct1Inputs */

const en_auth_upgradeacct1 = /** @type {(inputs: Auth_Upgradeacct1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Upgrading Account`)
};

const es_auth_upgradeacct1 = /** @type {(inputs: Auth_Upgradeacct1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actualizando Cuenta`)
};

const fr_auth_upgradeacct1 = /** @type {(inputs: Auth_Upgradeacct1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mise à niveau du compte`)
};

const ar_auth_upgradeacct1 = /** @type {(inputs: Auth_Upgradeacct1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Upgrading Account`)
};

/**
* | output |
* | --- |
* | "Upgrading Account" |
*
* @param {Auth_Upgradeacct1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const auth_upgradeacct1 = /** @type {((inputs?: Auth_Upgradeacct1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Upgradeacct1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_auth_upgradeacct1(inputs)
	if (locale === "es") return es_auth_upgradeacct1(inputs)
	if (locale === "fr") return fr_auth_upgradeacct1(inputs)
	return ar_auth_upgradeacct1(inputs)
});
export { auth_upgradeacct1 as "auth.upgradeAcct" }