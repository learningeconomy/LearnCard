/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Auth_Upgradedesc1Inputs */

const en_auth_upgradedesc1 = /** @type {(inputs: Auth_Upgradedesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`We're upgrading your account security. This may take a moment.`)
};

const es_auth_upgradedesc1 = /** @type {(inputs: Auth_Upgradedesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Estamos mejorando la seguridad de tu cuenta. Esto puede tomar un momento.`)
};

const fr_auth_upgradedesc1 = /** @type {(inputs: Auth_Upgradedesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nous améliorons la sécurité de votre compte. Cela peut prendre un instant.`)
};

const ar_auth_upgradedesc1 = /** @type {(inputs: Auth_Upgradedesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نحن نرقّي أمان حسابك. قد يستغرق هذا لحظة.`)
};

/**
* | output |
* | --- |
* | "We're upgrading your account security. This may take a moment." |
*
* @param {Auth_Upgradedesc1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const auth_upgradedesc1 = /** @type {((inputs?: Auth_Upgradedesc1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Upgradedesc1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_auth_upgradedesc1(inputs)
	if (locale === "es") return es_auth_upgradedesc1(inputs)
	if (locale === "fr") return fr_auth_upgradedesc1(inputs)
	return ar_auth_upgradedesc1(inputs)
});
export { auth_upgradedesc1 as "auth.upgradeDesc" }